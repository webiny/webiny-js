import { Output } from "ai";
import { z } from "zod";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";
import { UpdateFileUseCase } from "@webiny/api-file-manager/features/file/UpdateFile/index.js";
import { GetSettingsUseCase as FmGetSettingsUseCase } from "@webiny/api-file-manager/features/settings/GetSettings/abstractions.js";
import { WebsocketService } from "@webiny/api-websockets/features/WebsocketService/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";

export const AI_IMAGE_ENRICHMENT_TASK_ID = "fmAiImageEnrichment";

const AI_PROMPT =
    "Analyze this image and return up to 5 lowercase descriptive tags and one short sentence describing the image.";

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
        private getSettings: GetSettingsUseCase.Interface,
        private encryption: Encryption.Interface,
        private websocketService?: WebsocketService.Interface
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

        const aiSettingsResult = await this.getSettings.execute();

        if (aiSettingsResult.isFail()) {
            return controller.response.error({
                message: "No AI provider configured. Add a provider in AI Power Ups settings."
            });
        }

        const aiSettings = aiSettingsResult.value;

        const firstProvider = aiSettings.providers.presets[0];

        if (!firstProvider) {
            return controller.response.done({
                message: "No AI provider configured. Add a provider in AI Power Ups settings."
            });
        }

        let tags: string[] = [];
        let description = "";
        try {
            const aiResult = await this.ai.generateText({
                model: firstProvider.model,
                output: aiOutputSchema,
                connection: {
                    sdkName: firstProvider.model.split("/")[0],
                    apiKey: await this.encryption.decrypt(firstProvider.apiKeyEncrypted)
                },
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
                                text: AI_PROMPT
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

        const connectionsResult = await this.websocketService.listConnections();
        if (connectionsResult.isOk() && connectionsResult.value.length > 0) {
            await this.websocketService.sendToConnections(connectionsResult.value, {
                action: "fm.file.enrichment",
                data: {
                    id: file.id,
                    tags: mergedTags,
                    description
                }
            });
        }

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
        GetSettingsUseCase,
        Encryption,
        [WebsocketService, { optional: true }]
    ]
});
