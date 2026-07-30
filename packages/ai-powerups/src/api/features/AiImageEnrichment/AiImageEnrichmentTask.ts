import { Output } from "ai";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import {
    AI_ENRICHMENT_PROMPT,
    aiEnrichmentSchema,
    ApplyImageEnrichmentUseCase,
    PrepareImageEnrichmentUseCase
} from "./abstractions.js";
import { EnrichmentNotAnImageError } from "./errors.js";

export const AI_IMAGE_ENRICHMENT_TASK_ID = "fmAiImageEnrichment";

export interface IAiImageEnrichmentTaskInput {
    fileId: string;
}

/**
 * Background enrichment, triggered after a file is created. Shares its preparation and persistence
 * with the streaming HTTP route (`AiImageEnrichmentStreamRoute`); the only difference is that this
 * one waits for the whole AI response, because a background task has no one to stream to.
 */
class AiImageEnrichmentTaskImpl implements TaskDefinition.Interface<IAiImageEnrichmentTaskInput> {
    id = AI_IMAGE_ENRICHMENT_TASK_ID;
    title = "File Manager - AI Image Enrichment";
    description = "Automatically enriches uploaded images with AI-generated tags and description.";
    maxIterations = 1;
    isPrivate = true;
    databaseLogs = false;

    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    constructor(
        private prepare: PrepareImageEnrichmentUseCase.Interface,
        private apply: ApplyImageEnrichmentUseCase.Interface,
        private ai: Ai.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskDefinition.RunParams<IAiImageEnrichmentTaskInput>): Promise<
        TaskDefinition.Result<IAiImageEnrichmentTaskInput>
    > {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const preparedResult = await this.prepare.execute(input.fileId);
        if (preparedResult.isFail()) {
            const error = preparedResult.error;
            // A non-image isn't a failure — nothing to enrich, so the task is simply done.
            if (error instanceof EnrichmentNotAnImageError) {
                return controller.response.done(error.message);
            }
            return controller.response.error({ message: error.message });
        }

        const prepared = preparedResult.value;

        let tags: string[];
        let description: string;
        try {
            const aiResult = await this.ai.generateText({
                model: prepared.model,
                output: Output.object({ schema: aiEnrichmentSchema }),
                connection: prepared.connection,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "file",
                                data: prepared.imageBase64,
                                mediaType: prepared.imageMediaType
                            },
                            {
                                type: "text",
                                text: AI_ENRICHMENT_PROMPT
                            }
                        ]
                    }
                ]
            });

            tags = aiResult.output.tags;
            description = aiResult.output.description;
        } catch (error) {
            return controller.response.error({
                message: `AI enrichment failed: ${error instanceof Error ? error.message : String(error)}`
            });
        }

        const appliedResult = await this.apply.execute({
            fileId: prepared.fileId,
            existingTags: prepared.existingTags,
            tags,
            description
        });

        if (appliedResult.isFail()) {
            return controller.response.error({ message: appliedResult.error.message });
        }

        return controller.response.done("AI image enrichment completed successfully.");
    }
}

export const AiImageEnrichmentTask = TaskDefinition.createImplementation({
    implementation: AiImageEnrichmentTaskImpl,
    dependencies: [PrepareImageEnrichmentUseCase, ApplyImageEnrichmentUseCase, Ai]
});
