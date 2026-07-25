import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('health')
  async health() {
    // Runs a real query (not just a static 200) so scheduled pings also
    // count as Supabase project activity and prevent its 7-day auto-pause.
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', service: 'idlib-smart-platform-api', time: new Date().toISOString() };
  }
}
