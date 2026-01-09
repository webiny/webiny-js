import { FileAfterDeleteHandler } from "@webiny/api-file-manager/features/file/DeleteFile/events.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { CdnPathsGenerator } from "~/utils/CdnPathsGenerator.js";

class FlushCacheOnFileDeleteHandlerImpl implements FileAfterDeleteHandler.Interface {
    private readonly pathsGenerator: CdnPathsGenerator;

    constructor(private taskService: TaskService.Interface) {
        this.pathsGenerator = new CdnPathsGenerator();
    }

    async handle(event: FileAfterDeleteHandler.Event): Promise<void> {
        const { file } = event.payload;

        await this.taskService.trigger({
            definition: "cloudfrontInvalidateCache",
            input: {
                caller: "fm-before-delete",
                paths: this.pathsGenerator.generate(file.id)
            }
        });
    }
}

export const FlushCacheOnFileDeleteHandler = FileAfterDeleteHandler.createImplementation({
    implementation: FlushCacheOnFileDeleteHandlerImpl,
    dependencies: [TaskService]
});
