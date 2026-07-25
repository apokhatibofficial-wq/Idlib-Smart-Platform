import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SanitizeText } from '../../../common/utils/sanitize.util';

export class CreateNewsDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @SanitizeText()
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @SanitizeText()
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @SanitizeText()
  tag?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateAlertDto {
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  @SanitizeText()
  text!: string;
}

export class UpdateNewsDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @SanitizeText()
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @SanitizeText()
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @SanitizeText()
  tag?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateAlertDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  @SanitizeText()
  text?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
