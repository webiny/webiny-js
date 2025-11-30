import { FileBeforeUpdateHandler } from "@webiny/api-file-manager/features/file/UpdateFile/events.js";
import { TaskService } from "@webiny/tasks/features/TaskService/abstractions.js";
import { CdnPathsGenerator } from "./CdnPathsGenerator.js";

class FlushCacheOnFileUpdateHandlerImpl implements FileBeforeUpdateHandler.Interface {
    private readonly pathsGenerator: CdnPathsGenerator;

    constructor(private taskService: TaskService.Interface) {
        this.pathsGenerator = new CdnPathsGenerator();
    }

    async handle(event: FileBeforeUpdateHandler.Event): Promise<void> {
        const { file, original } = event.payload;

        const prevAccessControl = original.accessControl;
        const newAccessControl = file.accessControl;

        // Only trigger cache flush if access control type has changed
        if (prevAccessControl?.type === newAccessControl?.type) {
            return;
        }

        await this.taskService.trigger({
            definition: "cloudfrontInvalidateCache",
            input: {
                caller: "fm-before-update",
                paths: this.pathsGenerator.generate(file)
            }
        });
    }
}

export const FlushCacheOnFileUpdateHandler = FileBeforeUpdateHandler.createImplementation({
    implementation: FlushCacheOnFileUpdateHandlerImpl,
    dependencies: [TaskService]
});
