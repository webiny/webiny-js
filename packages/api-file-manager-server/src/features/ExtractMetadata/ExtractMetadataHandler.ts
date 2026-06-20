import { FileAfterCreateEventHandler } from "@webiny/api-file-manager/features/file/CreateFile/events.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type { ExtractMetadataInput } from "./ExtractMetadataTask.js";

class ExtractMetadataHandlerImpl implements FileAfterCreateEventHandler.Interface {
    constructor(private readonly taskService: TaskService.Interface) {}

    async handle(event: FileAfterCreateEventHandler.Event): Promise<void> {
        const { file } = event.payload;

        /* Trigger the metadata extraction task. */
        await this.taskService.trigger<ExtractMetadataInput>({
            definition: "fileManagerExtractMetadata",
            input: {
                fileId: file.id
            }
        });
    }
}

export const ExtractMetadataHandler = FileAfterCreateEventHandler.createImplementation({
    implementation: ExtractMetadataHandlerImpl,
    dependencies: [TaskService]
});
