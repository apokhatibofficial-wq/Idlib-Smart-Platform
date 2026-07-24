import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/express-request';
import { MerchantService } from './merchant.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('merchant')
@Roles(Role.MERCHANT)
export class MerchantController {
  constructor(private readonly merchant: MerchantService) {}

  @Get('overview')
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.merchant.overview(user.id);
  }

  @Get('chart')
  chart(@CurrentUser() user: AuthenticatedUser) {
    return this.merchant.weeklyOrderChart(user.id);
  }

  @Get('store')
  getStore(@CurrentUser() user: AuthenticatedUser) {
    return this.merchant.getMyStore(user.id);
  }

  @Patch('store')
  updateStore(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateStoreDto) {
    return this.merchant.updateMyStore(user.id, dto);
  }

  @Get('products')
  listProducts(@CurrentUser() user: AuthenticatedUser) {
    return this.merchant.listProducts(user.id);
  }

  @Post('products')
  createProduct(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProductDto) {
    return this.merchant.createProduct(user.id, dto);
  }

  @Patch('products/:id')
  updateProduct(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProductDto,
  ) {
    return this.merchant.updateProduct(user.id, id, dto);
  }

  @Get('orders')
  listOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.merchant.listOrders(user.id);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.merchant.updateOrderStatus(user.id, id, dto.status);
  }

  @Get('coupons')
  listCoupons(@CurrentUser() user: AuthenticatedUser) {
    return this.merchant.listCoupons(user.id);
  }

  @Post('coupons')
  createCoupon(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCouponDto) {
    return this.merchant.createCoupon(user.id, dto);
  }
}
