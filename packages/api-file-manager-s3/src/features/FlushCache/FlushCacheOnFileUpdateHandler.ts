import { FileBeforeUpdateEventHandler } from "@webiny/api-file-manager/features/file/UpdateFile/events.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { CdnPathsGenerator } from "~/utils/CdnPathsGenerator.js";

class FlushCacheOnFileUpdateHandlerImpl implements FileBeforeUpdateEventHandler.Interface {
    private readonly pathsGenerator: CdnPathsGenerator;

    constructor(private taskService: TaskService.Interface) {
        this.pathsGenerator = new CdnPathsGenerator();
    }

    async handle(event: FileBeforeUpdateEventHandler.Event): Promise<void> {
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
                paths: this.pathsGenerator.generate(file.id)
            }
        });
    }
}

export const FlushCacheOnFileUpdateHandler = FileBeforeUpdateEventHandler.createImplementation({
    implementation: FlushCacheOnFileUpdateHandlerImpl,
    dependencies: [TaskService]
});
