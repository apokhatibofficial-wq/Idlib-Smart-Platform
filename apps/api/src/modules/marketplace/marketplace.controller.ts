import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common';
import { StoreCategory } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../../common/types/express-request';
import { MarketplaceService } from './marketplace.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplaceService) {}

  @Get('categories')
  categories() {
    return this.marketplace.categories();
  }

  @Get('stores')
  listStores(@Query('category') category?: string) {
    const value = category && category !== 'all' ? (category as StoreCategory) : undefined;
    return this.marketplace.listStores(value);
  }

  @Get('stores/:id')
  getStore(@Param('id') id: string) {
    return this.marketplace.getStore(id);
  }

  @Post('orders')
  @Audit('order.create')
  createOrder(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.marketplace.createOrder(user.id, dto);
  }

  @Get('orders/mine')
  listMyOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.marketplace.listMyOrders(user.id);
  }
}
