import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { SanitizeText } from '../../../common/utils/sanitize.util';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'الاسم الكامل يجب أن يتكون من حرفين على الأقل' })
  @MaxLength(80)
  @SanitizeText()
  fullName!: string;

  @IsEmail({}, { message: 'صيغة البريد الإلكتروني غير صحيحة' })
  @MaxLength(180)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل' })
  @MaxLength(128)
  @Matches(/(?=.*[a-zA-Z])(?=.*[0-9])/, {
    message: 'كلمة المرور يجب أن تحتوي على أحرف وأرقام معًا',
  })
  password!: string;
}
