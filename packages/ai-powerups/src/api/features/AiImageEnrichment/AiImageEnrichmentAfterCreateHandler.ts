import { FileAfterCreateEventHandler } from "@webiny/api-file-manager/features/file/CreateFile/events.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import type { IAiImageEnrichmentTaskInput } from "./AiImageEnrichmentTask.js";
import { AI_IMAGE_ENRICHMENT_TASK_ID } from "./AiImageEnrichmentTask.js";

class AiImageEnrichmentAfterCreateHandlerImpl implements FileAfterCreateEventHandler.Interface {
    constructor(
        private taskService: TaskService.Interface,
        private wcp: WcpContext.Interface
    ) {}

    async handle(event: FileAfterCreateEventHandler.Event): Promise<void> {
        const { file } = event.payload;

        if (!file.type.startsWith("image/")) {
            return;
        }

        // Gate at trigger-time, NOT at feature-registration time: the WCP license is loaded per
        // request by WcpLicenseInitializer (a RequestInitializer), which runs AFTER the register()
        // phase. A register-time check reads the placeholder NullLicense (canUse* → false), so the
        // feature would never register. handle() runs during a resolver, once the license is loaded.
        if (!this.wcp.canUseAiImageEnrichment()) {
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
        dependencies: [TaskService, WcpContext]
    }
);
