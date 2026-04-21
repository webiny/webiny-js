import "~/types.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { GetFileUseCase } from "~/features/file/GetFile/index.js";
import { UpdateFileUseCase } from "~/features/file/UpdateFile/index.js";
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";
import { GetSettingsUseCase as AiPowerUpsGetSettingsUseCase } from "@webiny/ai-powerups/api/features/GetSettings/index.js";
import { WebsocketService } from "@webiny/api-websockets/features/WebsocketService/index.js";

export const AI_IMAGE_ENRICHMENT_TASK_ID = "fmAiImageEnrichment";

const AI_PROMPT =
    'Analyze this image and return a JSON object with two keys: "tags" (array of up to 5 lowercase descriptive tags) and "description" (one short sentence describing the image). Return only the JSON object, nothing else. Example: {"tags":["nature","landscape","mountain"],"description":"A mountain landscape with a clear blue sky."}';

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

    constructor(
        private getFile: GetFileUseCase.Interface,
        private getSettings: GetSettingsUseCase.Interface,
        private updateFile: UpdateFileUseCase.Interface,
        private ai: Ai.Interface,
        private aiPowerUpsSettings: AiPowerUpsGetSettingsUseCase.Interface,
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

        const settingsResult = await this.getSettings.execute();
        const srcPrefix = settingsResult.isOk() ? (settingsResult.value.srcPrefix ?? "") : "";
        const imageUrl = `${srcPrefix}${file.key}`;

        const aiSettingsResult = await this.aiPowerUpsSettings.execute();

        if (aiSettingsResult.isFail()) {
            return controller.response.error({
                message: "No AI provider configured. Add a provider in AI Power Ups settings."
            });
        }

        const aiSettings = aiSettingsResult.value;

        // TODO: for now we're loading first provider, but later we'll be loading
        // TODO: the right provider via AI Powerups settings.
        const firstProvider = aiSettings.providers.presets[0];

        if (!firstProvider) {
            return controller.response.error({
                message: "No AI provider configured. Add a provider in AI Power Ups settings."
            });
        }

        let tags: string[] = [];
        let description = "";
        try {
            const aiResult = await this.ai.generateText({
                model: firstProvider.model,
                connection: {
                    sdkName: firstProvider.model.split("/")[0],
                    apiKey: firstProvider.apiKey
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

            const parsed = JSON.parse(aiResult.text);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                if (Array.isArray(parsed.tags)) {
                    tags = parsed.tags.filter((t: unknown): t is string => typeof t === "string");
                }
                if (typeof parsed.description === "string") {
                    description = parsed.description;
                }
            }
        } catch (error) {
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

        if (this.websocketService) {
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
        }

        return controller.response.done("AI image enrichment completed successfully.");
    }
}

export const AiImageEnrichmentTask = TaskDefinition.createImplementation({
    implementation: AiImageEnrichmentTaskImpl,
    dependencies: [
        GetFileUseCase,
        GetSettingsUseCase,
        UpdateFileUseCase,
        Ai,
        AiPowerUpsGetSettingsUseCase,
        [WebsocketService, { optional: true }]
    ]
});
