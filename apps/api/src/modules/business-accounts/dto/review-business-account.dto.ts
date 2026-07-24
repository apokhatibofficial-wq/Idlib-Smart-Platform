import { IsOptional, IsString, MaxLength } from 'class-validator';
import { SanitizeText } from '../../../common/utils/sanitize.util';

export class RejectBusinessAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @SanitizeText()
  reason?: string;
}
