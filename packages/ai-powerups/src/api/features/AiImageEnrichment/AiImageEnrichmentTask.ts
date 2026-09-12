import { Output } from "ai";
import { z } from "zod";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";
import { UpdateFileUseCase } from "@webiny/api-file-manager/features/file/UpdateFile/index.js";
import { GetSettingsUseCase as FmGetSettingsUseCase } from "@webiny/api-file-manager/features/settings/GetSettings/abstractions.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/features/SendToIdentity/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import {
    ResolveAiCapabilityUseCase,
    withAdditionalInstructions
} from "~/api/features/Capabilities/index.js";
import { FM_IMAGE_ENRICHMENT_CAPABILITY } from "./capability.js";

export const AI_IMAGE_ENRICHMENT_TASK_ID = "fmAiImageEnrichment";

const aiOutputSchema = Output.object({
    schema: z.object({
        tags: z.array(z.string()),
        description: z.string()
    })
});

export interface IAiImageEnrichmentTaskInput {
    fileId: string;
}

class AiImageEnrichmentTaskImpl implements TaskDefinition.Interface<IAiImageEnrichmentTaskInput> {
    id = AI_IMAGE_ENRICHMENT_TASK_ID;
    title = "File Manager - AI Image Enrichment";
    description = "Automatically enriches uploaded images with AI-generated tags and description.";
    maxIterations = 1;
    isPrivate = true;
    databaseLogs = false;

    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    constructor(
        private getFile: GetFileUseCase.Interface,
        private fmSettings: FmGetSettingsUseCase.Interface,
        private updateFile: UpdateFileUseCase.Interface,
        private ai: Ai.Interface,
        private resolveCapability: ResolveAiCapabilityUseCase.Interface,
        private logger: Logger.Interface,
        private identityContext: IdentityContext.Interface,
        private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
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

        const fileResult = await this.getFile.execute(input.fileId);
        if (fileResult.isFail()) {
            return controller.response.error({
                message: `File not found: ${input.fileId}`
            });
        }

        const file = fileResult.value;

        if (!file.type.startsWith("image/")) {
            return controller.response.done("File is not an image; skipping AI enrichment.");
        }

        const settingsResult = await this.fmSettings.execute();
        const srcPrefix = settingsResult.isOk() ? (settingsResult.value.srcPrefix ?? "") : "";
        const imageUrl = `${srcPrefix}${file.key}`;

        const resolved = await this.resolveCapability.execute(FM_IMAGE_ENRICHMENT_CAPABILITY);

        if (resolved.isFail()) {
            /*
             * A skip, not a failure. This feature is not licence-gated on this branch, so every
             * project that uploads an image without AI configured would otherwise get a failed task
             * on every upload. Today's behaviour for an unconfigured provider is the same soft
             * done; the log is new, because a skip and a misconfiguration used to look identical.
             */
            this.logger.warn(
                { fileId: input.fileId, reason: resolved.error.message },
                "Skipping AI image enrichment."
            );
            return controller.response.done(resolved.error.message);
        }

        const capability = resolved.value;

        let tags: string[] = [];
        let description = "";
        try {
            const aiResult = await this.ai.generateText({
                model: capability.model,
                output: aiOutputSchema,
                connection: capability.connection,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "image",
                                image: new URL(imageUrl)
                            },
                            {
                                type: "text",
                                text: withAdditionalInstructions(capability)
                            }
                        ]
                    }
                ]
            });

            tags = aiResult.output.tags;
            description = aiResult.output.description;
        } catch (error) {
            console.log("error", error.message);
            return controller.response.error({
                message: `AI enrichment failed: ${error instanceof Error ? error.message : String(error)}`
            });
        }

        const mergedTags = [...new Set([...file.tags, ...tags])];

        const updateResult = await this.updateFile.execute({
            id: file.id,
            tags: mergedTags,
            description
        });

        if (updateResult.isFail()) {
            return controller.response.error({
                message: `Failed to update file: ${updateResult.error.message}`
            });
        }

        const identity = this.identityContext.getIdentity();
        await this.sendToIdentity.execute(
            { id: identity.id },
            {
                action: "fm.file.enrichment",
                data: {
                    id: file.id,
                    tags: mergedTags,
                    description
                }
            }
        );

        return controller.response.done("AI image enrichment completed successfully.");
    }
}

export const AiImageEnrichmentTask = TaskDefinition.createImplementation({
    implementation: AiImageEnrichmentTaskImpl,
    dependencies: [
        GetFileUseCase,
        FmGetSettingsUseCase,
        UpdateFileUseCase,
        Ai,
        ResolveAiCapabilityUseCase,
        Logger,
        IdentityContext,
        WebsocketsSendToIdentityUseCase
    ]
});
