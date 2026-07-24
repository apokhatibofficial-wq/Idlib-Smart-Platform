import { IsEmail, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  email!: string;

  @Matches(/^\d{4,8}$/, { message: 'رمز التحقق غير صالح' })
  code!: string;
}

export class ResendOtpDto {
  @IsEmail()
  email!: string;
}
