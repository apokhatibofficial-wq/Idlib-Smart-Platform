import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { SanitizeText } from '../../../common/utils/sanitize.util';

export class CreateOrderDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  @SanitizeText()
  note?: string;
}
