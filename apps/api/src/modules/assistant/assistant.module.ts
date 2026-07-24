import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { ASSISTANT_ENGINE } from './assistant.interfaces';
import { KeywordAssistantEngine } from './engines/keyword-assistant.engine';

@Module({
  controllers: [AssistantController],
  providers: [
    AssistantService,
    KeywordAssistantEngine,
    { provide: ASSISTANT_ENGINE, useClass: KeywordAssistantEngine },
  ],
})
export class AssistantModule {}
