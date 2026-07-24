import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: 'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل' })
  @MaxLength(128)
  @Matches(/(?=.*[a-zA-Z])(?=.*[0-9])/, {
    message: 'كلمة المرور يجب أن تحتوي على أحرف وأرقام معًا',
  })
  newPassword!: string;
}
