import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCouponDto {
  @IsString()
  @MaxLength(30)
  @Matches(/^[A-Z0-9_-]{3,30}$/, {
    message: 'صيغة الكوبون غير صحيحة (أحرف إنجليزية كبيرة وأرقام فقط)',
  })
  code!: string;

  @IsInt()
  @Min(1)
  @Max(90)
  percentOff!: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
