import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ComplaintStatus, Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../../common/types/express-request';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintStatusDto } from './dto/update-status.dto';

@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaints: ComplaintsService) {}

  @Get('categories')
  categories() {
    return this.complaints.categories();
  }

  @Post()
  @Audit('complaint.create')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateComplaintDto) {
    return this.complaints.create(user.id, dto);
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.complaints.listMine(user.id);
  }

  @Roles(Role.ADMIN)
  @Get()
  listAll(@Query('status') status?: ComplaintStatus) {
    return this.complaints.listAll(status);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.complaints.getOne(id, user);
  }

  @Roles(Role.ADMIN)
  @Audit('complaint.update_status')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateComplaintStatusDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.complaints.updateStatus(id, dto, admin.id);
  }
}
