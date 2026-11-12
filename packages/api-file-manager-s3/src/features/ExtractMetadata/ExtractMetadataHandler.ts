import { FileAfterCreateEventHandler } from "@webiny/api-file-manager/features/file/CreateFile/events.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import type { ExtractMetadataInput } from "./ExtractMetadataTask.js";

class ExtractMetadataHandlerImpl implements FileAfterCreateEventHandler.Interface {
    constructor(
        private taskService: TaskService.Interface,
        private logger: Logger.Interface
    ) {}

    async handle(event: FileAfterCreateEventHandler.Event): Promise<void> {
        const { file } = event.payload;

        // The file is already stored, so a task that can't start is logged and doesn't fail the upload.
        const result = await this.taskService.trigger<ExtractMetadataInput>({
            definition: "fileManagerExtractMetadata",
            input: {
                fileId: file.id
            }
        });
        if (result.isFail()) {
            this.logger.error(
                { error: result.error, fileId: file.id },
                "Could not start the metadata extraction."
            );
        }
    }
}

export const ExtractMetadataHandler = FileAfterCreateEventHandler.createImplementation({
    implementation: ExtractMetadataHandlerImpl,
    dependencies: [TaskService, Logger]
});
