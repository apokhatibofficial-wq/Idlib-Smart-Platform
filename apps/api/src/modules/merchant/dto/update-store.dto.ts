import { StoreCategory } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SanitizeText } from '../../../common/utils/sanitize.util';

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @SanitizeText()
  name?: string;

  @IsOptional()
  @IsEnum(StoreCategory)
  category?: StoreCategory;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @SanitizeText()
  description?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsBoolean()
  deliveryAvailable?: boolean;
}
