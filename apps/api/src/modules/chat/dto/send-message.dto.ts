import { IsString, MaxLength, MinLength } from 'class-validator';
import { SanitizeText } from '../../../common/utils/sanitize.util';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  @SanitizeText()
  body!: string;
}
