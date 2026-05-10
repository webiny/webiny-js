import { FileAfterCreateEventHandler } from "@webiny/api-file-manager/features/file/CreateFile/events.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type { IAiImageEnrichmentTaskInput } from "./AiImageEnrichmentTask.js";
import { AI_IMAGE_ENRICHMENT_TASK_ID } from "./AiImageEnrichmentTask.js";

class AiImageEnrichmentAfterCreateHandlerImpl implements FileAfterCreateEventHandler.Interface {
    constructor(private taskService: TaskService.Interface) {}

    async handle(event: FileAfterCreateEventHandler.Event): Promise<void> {
        const { file } = event.payload;

        if (!file.type.startsWith("image/")) {
            return;
        }

        await this.taskService.trigger<IAiImageEnrichmentTaskInput>({
            definition: AI_IMAGE_ENRICHMENT_TASK_ID,
            input: {
                fileId: file.id
            }
        });
    }
}

export const AiImageEnrichmentAfterCreateHandler = FileAfterCreateEventHandler.createImplementation(
    {
        implementation: AiImageEnrichmentAfterCreateHandlerImpl,
        dependencies: [TaskService]
    }
);
