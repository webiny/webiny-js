import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { ObjectStorage } from "~/features/ObjectStorage/abstractions.js";

export interface CleanupStaleMultipartUploadsInput {
    /* Reserved for future use. */
    noop?: boolean;
}

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

class CleanupStaleMultipartUploadsTaskHandlerImpl implements TaskHandler.Interface<CleanupStaleMultipartUploadsInput> {
    public constructor(private readonly objectStorage: ObjectStorage.Interface) {}

    public async run({
        controller
    }: TaskHandler.RunParams<CleanupStaleMultipartUploadsInput>): Promise<
        TaskDefinition.Result<CleanupStaleMultipartUploadsInput>
    > {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const startedBefore = new Date(Date.now() - STALE_THRESHOLD_MS);
        await this.objectStorage.abortMultipartUploadsStartedBefore(startedBefore);

        return controller.response.done();
    }
}

const CleanupStaleMultipartUploadsTaskHandler = TaskHandler.createImplementation({
    implementation: CleanupStaleMultipartUploadsTaskHandlerImpl,
    dependencies: [ObjectStorage]
});

class CleanupStaleMultipartUploadsTaskImpl implements TaskDefinition.Interface {
    public readonly id = "fileManagerCleanupStaleMultipartUploads";
    public readonly title = "Clean up stale multipart uploads";
    public readonly description = "Abandons multipart uploads started more than 24 hours ago.";
    public readonly maxIterations = 1;
    public readonly isPrivate = true;
    public readonly databaseLogs = false;
    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    handler = CleanupStaleMultipartUploadsTaskHandler;
}

export const CleanupStaleMultipartUploadsTaskDefinition = TaskDefinition.createImplementation({
    implementation: CleanupStaleMultipartUploadsTaskImpl,
    dependencies: []
});
