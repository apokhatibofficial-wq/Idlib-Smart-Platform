import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { AttachmentKind, ComplaintCategory, ComplaintPriority } from '@prisma/client';
import { SanitizeText } from '../../../common/utils/sanitize.util';

class ComplaintAttachmentDto {
  @IsString()
  url!: string;

  @IsIn(['PHOTO', 'VIDEO'])
  kind!: AttachmentKind;

  @IsString()
  mimeType!: string;

  @IsNumber()
  @IsPositive()
  sizeBytes!: number;
}

export class CreateComplaintDto {
  @IsEnum(ComplaintCategory)
  category!: ComplaintCategory;

  @IsEnum(ComplaintPriority)
  priority!: ComplaintPriority;

  @IsString()
  @MinLength(10, { message: 'وصف البلاغ يجب أن يتكون من 10 أحرف على الأقل' })
  @MaxLength(2000)
  @SanitizeText()
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @SanitizeText()
  locationLabel?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ValidateIf((o: CreateComplaintDto) => o.category === 'BRIBERY')
  @IsString()
  @MinLength(2, { message: 'اسم الموظف مطلوب في بلاغات الرشوة' })
  @MaxLength(120)
  @SanitizeText()
  employeeName?: string;

  @ValidateIf((o: CreateComplaintDto) => o.category === 'BRIBERY' && !!o.witness1)
  @IsString()
  @MaxLength(120)
  @SanitizeText()
  witness1?: string;

  @ValidateIf((o: CreateComplaintDto) => o.category === 'BRIBERY' && !!o.witness2)
  @IsString()
  @MaxLength(120)
  @SanitizeText()
  witness2?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => ComplaintAttachmentDto)
  attachments?: ComplaintAttachmentDto[];
}
