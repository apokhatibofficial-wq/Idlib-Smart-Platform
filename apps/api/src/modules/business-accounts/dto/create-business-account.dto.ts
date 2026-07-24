import { StoreCategory, ProductAvailability } from '@prisma/client';
import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SanitizeText } from '../../../common/utils/sanitize.util';

export class CreateBusinessAccountDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @SanitizeText()
  businessName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  registrationNumber!: string;

  @IsString()
  @MaxLength(20)
  phone!: string;

  @IsEnum(StoreCategory)
  category!: StoreCategory;

  @IsString()
  @MinLength(10, { message: 'وصف النشاط يجب أن يتكون من 10 أحرف على الأقل' })
  @MaxLength(1000)
  @SanitizeText()
  description!: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString({ each: true })
  photoUrls?: string[];

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @SanitizeText()
  firstProductName!: string;

  @IsNumberString({}, { message: 'السعر يجب أن يكون رقمًا' })
  firstProductPrice!: string;

  @IsEnum(ProductAvailability)
  firstProductAvailable!: ProductAvailability;
}
