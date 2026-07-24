import { ProductAvailability } from '@prisma/client';
import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SanitizeText } from '../../../common/utils/sanitize.util';

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @SanitizeText()
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @SanitizeText()
  description?: string;

  @IsNumberString({}, { message: 'السعر يجب أن يكون رقمًا' })
  price!: string;

  @IsOptional()
  @IsEnum(ProductAvailability)
  availability?: ProductAvailability;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @SanitizeText()
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @SanitizeText()
  description?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'السعر يجب أن يكون رقمًا' })
  price?: string;

  @IsOptional()
  @IsEnum(ProductAvailability)
  availability?: ProductAvailability;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
