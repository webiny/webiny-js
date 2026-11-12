import { FileAfterCreateEventHandler } from "@webiny/api-file-manager/features/file/CreateFile/events.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import type { IAiImageEnrichmentTaskInput } from "./AiImageEnrichmentTask.js";
import { AI_IMAGE_ENRICHMENT_TASK_ID } from "./AiImageEnrichmentTask.js";

class AiImageEnrichmentAfterCreateHandlerImpl implements FileAfterCreateEventHandler.Interface {
    constructor(
        private taskService: TaskService.Interface,
        private logger: Logger.Interface
    ) {}

    async handle(event: FileAfterCreateEventHandler.Event): Promise<void> {
        const { file } = event.payload;

        if (!file.type.startsWith("image/")) {
            return;
        }

        // The file is already stored, so a task that can't start is logged and doesn't fail the upload.
        const result = await this.taskService.trigger<IAiImageEnrichmentTaskInput>({
            definition: AI_IMAGE_ENRICHMENT_TASK_ID,
            input: {
                fileId: file.id
            }
        });
        if (result.isFail()) {
            this.logger.error(
                { error: result.error, fileId: file.id },
                "Could not start the AI image enrichment."
            );
        }
    }
}

export const AiImageEnrichmentAfterCreateHandler = FileAfterCreateEventHandler.createImplementation(
    {
        implementation: AiImageEnrichmentAfterCreateHandlerImpl,
        dependencies: [TaskService, Logger]
    }
);
