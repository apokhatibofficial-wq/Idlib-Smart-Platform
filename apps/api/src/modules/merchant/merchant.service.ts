import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CouponStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PushService } from '../push/push.service';
import { ORDER_STATUS_LABELS, formatOrderDisplayId } from '../marketplace/marketplace.constants';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class MerchantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly push: PushService,
  ) {}

  private async getOwnedStore(userId: string) {
    const store = await this.prisma.store.findUnique({ where: { ownerId: userId } });
    if (!store) throw new NotFoundException('لا يوجد لديك متجر تجاري بعد');
    return store;
  }

  async getMyStore(userId: string) {
    return this.getOwnedStore(userId);
  }

  async updateMyStore(userId: string, dto: UpdateStoreDto) {
    const store = await this.getOwnedStore(userId);
    const updated = await this.prisma.store.update({ where: { id: store.id }, data: dto });
    await this.auditLog.log({
      actorId: userId,
      action: 'store.update',
      targetType: 'store',
      targetId: store.id,
    });
    return updated;
  }

  async overview(userId: string) {
    const store = await this.getOwnedStore(userId);
    const [productCount, orders, distinctCustomers] = await Promise.all([
      this.prisma.product.count({ where: { storeId: store.id } }),
      this.prisma.order.findMany({ where: { storeId: store.id }, include: { product: true } }),
      this.prisma.order.findMany({
        where: { storeId: store.id },
        distinct: ['customerId'],
        select: { customerId: true },
      }),
    ]);

    const salesTotal = orders
      .filter((o) => o.status === OrderStatus.DELIVERED)
      .reduce((sum, o) => sum + Number(o.product.price) * o.quantity, 0);

    return {
      storeName: store.name,
      productCount,
      orderCount: orders.length,
      customerCount: distinctCustomers.length,
      salesTotal,
    };
  }

  async weeklyOrderChart(userId: string) {
    const store = await this.getOwnedStore(userId);
    const since = new Date(Date.now() - 6 * DAY_MS);
    since.setHours(0, 0, 0, 0);

    const orders = await this.prisma.order.findMany({
      where: { storeId: store.id, createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const buckets = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(since.getTime() + i * DAY_MS);
      return { date: day.toISOString().slice(0, 10), count: 0 };
    });
    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      const bucket = buckets.find((b) => b.date === key);
      if (bucket) bucket.count += 1;
    }
    return buckets;
  }

  async listProducts(userId: string) {
    const store = await this.getOwnedStore(userId);
    return this.prisma.product.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProduct(userId: string, dto: CreateProductDto) {
    const store = await this.getOwnedStore(userId);
    const product = await this.prisma.product.create({ data: { ...dto, storeId: store.id } });
    await this.auditLog.log({
      actorId: userId,
      action: 'product.create',
      targetType: 'product',
      targetId: product.id,
    });
    return product;
  }

  async updateProduct(userId: string, productId: string, dto: UpdateProductDto) {
    const store = await this.getOwnedStore(userId);
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.storeId !== store.id) throw new NotFoundException('المنتج غير موجود');

    const updated = await this.prisma.product.update({ where: { id: productId }, data: dto });
    await this.auditLog.log({
      actorId: userId,
      action: 'product.update',
      targetType: 'product',
      targetId: productId,
    });
    return updated;
  }

  async listOrders(userId: string) {
    const store = await this.getOwnedStore(userId);
    const orders = await this.prisma.order.findMany({
      where: { storeId: store.id },
      include: { product: true, customer: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => ({
      id: o.id,
      displayId: formatOrderDisplayId(o.sequenceNumber),
      product: o.product.name,
      customer: o.customer.fullName,
      status: o.status,
      statusLabel: ORDER_STATUS_LABELS[o.status],
      quantity: o.quantity,
      createdAt: o.createdAt,
    }));
  }

  async updateOrderStatus(userId: string, orderId: string, status: OrderStatus) {
    const store = await this.getOwnedStore(userId);
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.storeId !== store.id) throw new NotFoundException('الطلب غير موجود');

    const updated = await this.prisma.order.update({ where: { id: orderId }, data: { status } });
    await this.auditLog.log({
      actorId: userId,
      action: 'order.update_status',
      targetType: 'order',
      targetId: orderId,
      metadata: { from: order.status, to: status },
    });

    await this.push.notifyUser(order.customerId, {
      title: 'تحديث على طلبك',
      body: `طلب #${formatOrderDisplayId(order.sequenceNumber)}: ${ORDER_STATUS_LABELS[status]}`,
      url: '/profile/orders',
      tag: `order-${orderId}`,
    });

    return updated;
  }

  async listCoupons(userId: string) {
    const store = await this.getOwnedStore(userId);
    return this.prisma.coupon.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCoupon(userId: string, dto: CreateCouponDto) {
    const store = await this.getOwnedStore(userId);
    const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code } });
    if (existing) throw new ForbiddenException('رمز الكوبون هذا مستخدم بالفعل');

    const coupon = await this.prisma.coupon.create({
      data: {
        storeId: store.id,
        code: dto.code,
        percentOff: dto.percentOff,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        status: CouponStatus.PENDING_APPROVAL,
      },
    });
    await this.auditLog.log({
      actorId: userId,
      action: 'coupon.create',
      targetType: 'coupon',
      targetId: coupon.id,
    });
    return coupon;
  }
}
