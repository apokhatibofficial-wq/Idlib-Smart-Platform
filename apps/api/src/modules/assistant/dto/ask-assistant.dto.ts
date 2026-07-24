import { IsString, MaxLength, MinLength } from 'class-validator';
import { SanitizeText } from '../../../common/utils/sanitize.util';

export class AskAssistantDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  @SanitizeText()
  question!: string;
}
