import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { SanitizeText } from '../../../common/utils/sanitize.util';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @SanitizeText()
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_.]{3,24}$/, {
    message: 'اسم المستخدم يجب أن يتكون من 3 إلى 24 حرفًا (أحرف إنجليزية وأرقام و . _ فقط)',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s-]{7,20}$/, { message: 'رقم الهاتف غير صالح' })
  phone?: string;
}
