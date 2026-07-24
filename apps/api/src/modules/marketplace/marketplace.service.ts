import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StoreCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { ChatService } from '../chat/chat.service';
import { PushService } from '../push/push.service';
import {
  STORE_CATEGORY_LABELS,
  ORDER_STATUS_LABELS,
  formatOrderDisplayId,
} from './marketplace.constants';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly chat: ChatService,
    private readonly push: PushService,
  ) {}

  async listStores(category?: StoreCategory) {
    const stores = await this.prisma.store.findMany({
      where: { isActive: true, category },
      orderBy: { createdAt: 'desc' },
    });
    return stores.map((s) => ({ ...s, categoryLabel: STORE_CATEGORY_LABELS[s.category] }));
  }

  categories() {
    return [
      { key: 'all', label: 'الكل' },
      ...Object.entries(STORE_CATEGORY_LABELS).map(([key, label]) => ({ key, label })),
    ];
  }

  async getStore(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id, isActive: true },
      include: { products: { orderBy: { createdAt: 'desc' } } },
    });
    if (!store) throw new NotFoundException('المتجر غير موجود');
    return { ...store, categoryLabel: STORE_CATEGORY_LABELS[store.category] };
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { store: true },
    });
    if (!product || !product.store.isActive) throw new NotFoundException('المنتج غير موجود');
    if (product.availability !== 'AVAILABLE')
      throw new BadRequestException('المنتج غير متوفر حاليًا');

    const order = await this.prisma.order.create({
      data: {
        storeId: product.storeId,
        productId: product.id,
        customerId: userId,
        quantity: dto.quantity ?? 1,
        note: dto.note,
      },
      include: { product: true, store: true },
    });

    await this.auditLog.log({
      actorId: userId,
      action: 'order.create',
      targetType: 'order',
      targetId: order.id,
      metadata: { storeId: product.storeId, productId: product.id },
    });

    const conversation = await this.chat.findOrCreateDirectConversation(
      userId,
      product.store.ownerId,
      product.store.name,
    );
    await this.chat.postSystemMessage(
      conversation.id,
      `طلب جديد #${formatOrderDisplayId(order.sequenceNumber)}: ${product.name} × ${order.quantity}`,
    );

    await this.push.notifyUser(product.store.ownerId, {
      title: 'طلب جديد',
      body: `${product.name} × ${order.quantity} — طلب #${formatOrderDisplayId(order.sequenceNumber)}`,
      url: '/merchant/orders',
      tag: `order-${order.id}`,
    });

    return this.toOrderDto(order);
  }

  async listMyOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { customerId: userId },
      include: { product: true, store: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.toOrderDto(o));
  }

  private toOrderDto(order: {
    id: string;
    sequenceNumber: number;
    status: keyof typeof ORDER_STATUS_LABELS;
    quantity: number;
    note: string | null;
    createdAt: Date;
    product: { name: string; price: unknown };
    store: { name: string };
  }) {
    return {
      id: order.id,
      displayId: formatOrderDisplayId(order.sequenceNumber),
      status: order.status,
      statusLabel: ORDER_STATUS_LABELS[order.status],
      quantity: order.quantity,
      note: order.note,
      productName: order.product.name,
      price: order.product.price,
      storeName: order.store.name,
      createdAt: order.createdAt,
    };
  }
}
