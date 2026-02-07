import { FileAfterCreateHandler } from "@webiny/api-file-manager/features/file/CreateFile/events.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type { ExtractMetadataInput } from "./ExtractMetadataTask.js";

class ExtractMetadataHandlerImpl implements FileAfterCreateHandler.Interface {
    constructor(private taskService: TaskService.Interface) {}

    async handle(event: FileAfterCreateHandler.Event): Promise<void> {
        const { file } = event.payload;

        // Trigger the metadata extraction task
        await this.taskService.trigger<ExtractMetadataInput>({
            definition: "fileManagerExtractMetadata",
            input: {
                fileId: file.id
            }
        });
    }
}

export const ExtractMetadataHandler = FileAfterCreateHandler.createImplementation({
    implementation: ExtractMetadataHandlerImpl,
    dependencies: [TaskService]
});
