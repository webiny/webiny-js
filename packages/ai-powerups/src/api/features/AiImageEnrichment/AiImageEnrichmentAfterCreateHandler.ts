import { FileAfterCreateEventHandler } from "@webiny/api-file-manager/features/file/CreateFile/events.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import type { IAiImageEnrichmentTaskInput } from "./AiImageEnrichmentTask.js";
import { AI_IMAGE_ENRICHMENT_TASK_ID } from "./AiImageEnrichmentTask.js";

class AiImageEnrichmentAfterCreateHandlerImpl implements FileAfterCreateEventHandler.Interface {
    constructor(
        private taskService: TaskService.Interface,
        private featureFlags: FeatureFlags.Interface
    ) {}

    async handle(event: FileAfterCreateEventHandler.Event): Promise<void> {
        const { file } = event.payload;

        if (!file.type.startsWith("image/")) {
            return;
        }

        // Per-file opt-out: a file created with `metadata.aiImageEnrichment === false` skips enrichment
        // (no description/tag extraction). For images uploaded as machine inputs — e.g. a component-
        // extraction reference crop — the enrichment is wasted work and unwanted metadata.
        if (file.metadata?.aiImageEnrichment === false) {
            return;
        }

        if (!this.featureFlags.get().isEnabled("aiPowerups.fileManager.imageEnrichment")) {
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
        dependencies: [TaskService, FeatureFlags]
    }
);
