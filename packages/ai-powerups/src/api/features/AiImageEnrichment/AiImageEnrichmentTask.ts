import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/features/SendToIdentity/abstractions.js";
import { ApplyImageEnrichmentUseCase, PrepareImageEnrichmentUseCase } from "./abstractions.js";
import { buildEnrichmentAiRequest } from "./buildEnrichmentAiRequest.js";
import { EnrichmentCapabilityDisabledError } from "./errors.js";
import { EnrichmentNotAnImageError } from "./errors.js";

export const AI_IMAGE_ENRICHMENT_TASK_ID = "fmAiImageEnrichment";

export const FILE_ENRICHMENT_FAILED_WEBSOCKET_ACTION = "fm.file.enrichment.failed";

export interface IAiImageEnrichmentTaskInput {
    fileId: string;
}

/**
 * Background enrichment, triggered after a file is created. Shares its preparation and persistence
 * with the streaming HTTP route (`AiImageEnrichmentStreamRoute`); the only difference is that this
 * one waits for the whole AI response, because a background task has no one to stream to.
 */
class AiImageEnrichmentTaskHandlerImpl implements TaskHandler.Interface<IAiImageEnrichmentTaskInput> {
    constructor(
        private prepare: PrepareImageEnrichmentUseCase.Interface,
        private apply: ApplyImageEnrichmentUseCase.Interface,
        private ai: Ai.Interface,
        private identityContext: IdentityContext.Interface,
        private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskHandler.RunParams<IAiImageEnrichmentTaskInput>): Promise<
        TaskDefinition.Result<IAiImageEnrichmentTaskInput>
    > {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const preparedResult = await this.prepare.execute(input.fileId);
        if (preparedResult.isFail()) {
            const error = preparedResult.error;
            /*
             * Neither of these is a failure. A non-image has nothing to enrich, and a switched-off
             * capability is a setting someone chose. Reporting either as an error would log one on
             * every upload. A real misconfiguration still falls through to the error below.
             */
            if (
                error instanceof EnrichmentNotAnImageError ||
                error instanceof EnrichmentCapabilityDisabledError
            ) {
                return controller.response.done(error.message);
            }
            return this.fail(controller, input.fileId, error.message);
        }

        const prepared = preparedResult.value;

        let tags: string[];
        let description: string;
        try {
            const request = buildEnrichmentAiRequest(prepared);
            const aiResult = await this.ai.generateText(request);

            tags = aiResult.output.tags;
            description = aiResult.output.description;
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);

            return this.fail(controller, input.fileId, `AI enrichment failed: ${reason}`);
        }

        const appliedResult = await this.apply.execute({
            fileId: prepared.fileId,
            tags,
            description
        });

        if (appliedResult.isFail()) {
            return this.fail(controller, input.fileId, appliedResult.error.message);
        }

        return controller.response.done("AI image enrichment completed successfully.");
    }

    /*
     * Fails the task AND tells the uploader. A failed task on its own only reaches the API log, so
     * a missing Vision model or an overloaded provider looked, from the File Manager, exactly like
     * enrichment never having run. Success already reaches the uploader the same way, from
     * `ApplyImageEnrichmentUseCase`.
     */
    private async fail(
        controller: TaskHandler.RunParams<IAiImageEnrichmentTaskInput>["controller"],
        fileId: string,
        message: string
    ): Promise<TaskDefinition.Result<IAiImageEnrichmentTaskInput>> {
        const identity = this.identityContext.getIdentity();

        // A notification is a courtesy; failing to send one must not replace the real error.
        if (identity?.id) {
            try {
                await this.sendToIdentity.execute(
                    { id: identity.id },
                    {
                        action: FILE_ENRICHMENT_FAILED_WEBSOCKET_ACTION,
                        data: { id: fileId, message }
                    }
                );
            } catch {
                // Deliberately ignored, see above.
            }
        }

        return controller.response.error({ message });
    }
}

const AiImageEnrichmentTaskHandler = TaskHandler.createImplementation({
    implementation: AiImageEnrichmentTaskHandlerImpl,
    dependencies: [
        PrepareImageEnrichmentUseCase,
        ApplyImageEnrichmentUseCase,
        Ai,
        IdentityContext,
        WebsocketsSendToIdentityUseCase
    ]
});

class AiImageEnrichmentTaskImpl implements TaskDefinition.Interface {
    id = AI_IMAGE_ENRICHMENT_TASK_ID;
    title = "File Manager - AI Image Enrichment";
    description = "Automatically enriches uploaded images with AI-generated tags and description.";
    maxIterations = 1;
    isPrivate = true;
    databaseLogs = false;
    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    handler = AiImageEnrichmentTaskHandler;
}

export const AiImageEnrichmentTask = TaskDefinition.createImplementation({
    implementation: AiImageEnrichmentTaskImpl,
    dependencies: []
});
