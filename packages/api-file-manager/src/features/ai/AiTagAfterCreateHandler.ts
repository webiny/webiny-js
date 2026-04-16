import { FileAfterCreateEventHandler } from "~/features/file/CreateFile/events.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type { IAiImageTaggingTaskInput } from "~/tasks/AiImageTaggingTask.js";
import { AI_IMAGE_TAGGING_TASK_ID } from "~/tasks/AiImageTaggingTask.js";

class AiTagAfterCreateHandlerImpl
  implements FileAfterCreateEventHandler.Interface
{
  constructor(private taskService: TaskService.Interface) {}

  async handle(event: FileAfterCreateEventHandler.Event): Promise<void> {
    const { file } = event.payload;

    if (!file.type.startsWith("image/")) {
      return;
    }

    await this.taskService.trigger<IAiImageTaggingTaskInput>({
      definition: AI_IMAGE_TAGGING_TASK_ID,
      input: {
        fileId: file.id,
      },
    });
  }
}

export const AiTagAfterCreateHandler =
  FileAfterCreateEventHandler.createImplementation({
    implementation: AiTagAfterCreateHandlerImpl,
    dependencies: [TaskService],
  });
