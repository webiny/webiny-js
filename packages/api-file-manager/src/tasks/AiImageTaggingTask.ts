import "~/types.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { GetFileUseCase } from "~/features/file/GetFile/index.js";
import { UpdateFileUseCase } from "~/features/file/UpdateFile/index.js";
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";
import { WebsocketService } from "@webiny/api-websockets/features/WebsocketService/index.js";

export const AI_IMAGE_TAGGING_TASK_ID = "fmAiImageTagging";

const AI_MODEL = "anthropic/claude-3-5-sonnet-20241022";

const AI_PROMPT =
  'Generate up to 5 descriptive tags for this image. Return only a JSON array of lowercase strings, nothing else. Example: ["nature","landscape","mountain"]';

export interface IAiImageTaggingTaskInput {
  fileId: string;
}

class AiImageTaggingTaskImpl
  implements TaskDefinition.Interface<IAiImageTaggingTaskInput>
{
  id = AI_IMAGE_TAGGING_TASK_ID;
  title = "File Manager - AI Image Tagging";
  description = "Automatically generates tags for uploaded images using AI.";
  maxIterations = 1;
  isPrivate = true;
  databaseLogs = false;

  constructor(
    private getFile: GetFileUseCase.Interface,
    private getSettings: GetSettingsUseCase.Interface,
    private updateFile: UpdateFileUseCase.Interface,
    private ai: Ai.Interface,
    private websocketService?: WebsocketService.Interface,
  ) {}

  async run({
    input,
    controller,
  }: TaskDefinition.RunParams<IAiImageTaggingTaskInput>): Promise<
    TaskDefinition.Result<IAiImageTaggingTaskInput>
  > {
    if (controller.runtime.isAborted()) {
      return controller.response.aborted();
    }

    const fileResult = await this.getFile.execute(input.fileId);
    if (fileResult.isFail()) {
      return controller.response.error({
        message: `File not found: ${input.fileId}`,
      });
    }

    const file = fileResult.value;

    if (!file.type.startsWith("image/")) {
      return controller.response.done(
        "File is not an image; skipping AI tagging.",
      );
    }

    const settingsResult = await this.getSettings.execute();
    const srcPrefix = settingsResult.isOk()
      ? (settingsResult.value.srcPrefix ?? "")
      : "";
    const imageUrl = `${srcPrefix}${file.key}`;

    let tags: string[] = [];
    try {
      const aiResult = await this.ai.generateText({
        model: AI_MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                image: new URL(imageUrl),
              },
              {
                type: "text",
                text: AI_PROMPT,
              },
            ],
          },
        ],
      });

      const parsed = JSON.parse(aiResult.text);
      if (Array.isArray(parsed)) {
        tags = parsed.filter((t): t is string => typeof t === "string");
      }
    } catch (error) {
      return controller.response.error({
        message: `AI tagging failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    const mergedTags = [...new Set([...file.tags, ...tags])];

    const updateResult = await this.updateFile.execute({
      id: file.id,
      tags: mergedTags,
    });

    if (updateResult.isFail()) {
      return controller.response.error({
        message: `Failed to update file tags: ${updateResult.error.message}`,
      });
    }

    if (this.websocketService) {
      const connectionsResult = await this.websocketService.listConnections();
      if (connectionsResult.isOk() && connectionsResult.value.length > 0) {
        await this.websocketService.sendToConnections(connectionsResult.value, {
          action: "fm.file.tags",
          data: {
            id: file.id,
            tags: mergedTags,
          },
        });
      }
    }

    return controller.response.done("AI image tagging completed successfully.");
  }
}

export const AiImageTaggingTask = TaskDefinition.createImplementation({
  implementation: AiImageTaggingTaskImpl,
  dependencies: [
    GetFileUseCase,
    GetSettingsUseCase,
    UpdateFileUseCase,
    Ai,
    [WebsocketService, { optional: true }],
  ],
});
