import { ComplaintStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { SanitizeText } from '../../../common/utils/sanitize.util';

export class UpdateComplaintStatusDto {
  @IsEnum(ComplaintStatus)
  status!: ComplaintStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @SanitizeText()
  note?: string;
}
