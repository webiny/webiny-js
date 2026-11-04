import { FolderAfterCreateEventHandler } from "~/features/folder/CreateFolder/abstractions.js";
import type { FolderAfterCreateEvent } from "~/features/folder/CreateFolder/events.js";
import type { ICreateFlpTaskInput } from "~/types.js";
import { CREATE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";

/*
 * Folder reads report permissions from the FLP record, which the task writes later. So the task,
 * not this handler, tells the admin about the new folder, and it needs to know whom to tell.
 */
class CreateFlpOnFolderCreatedHandlerImpl implements FolderAfterCreateEventHandler.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private tasks: TaskService.Interface,
        private logger: Logger.Interface
    ) {}

    async handle(event: FolderAfterCreateEvent): Promise<void> {
        const { folder } = event.payload;

        try {
            const result = await this.tasks.trigger<ICreateFlpTaskInput>({
                definition: CREATE_FLP_TASK_ID,
                // Nobody to tell when there is no identity, as in some system calls.
                input: { folder, notifyIdentityId: this.identityContext.getIdentity()?.id }
            });
            if (result.isFail()) {
                this.logFailure(folder.id, result.error);
            }
        } catch (error) {
            this.logFailure(folder.id, error);
        }
    }

    /*
     * The folder change is already saved, so it stands. But the folder is left without an FLP
     * record, and this log is the only trace of why.
     */
    private logFailure(folderId: string, error: unknown): void {
        this.logger.error(
            { error, folderId },
            "Could not trigger the task that creates the folder's FLP record."
        );
    }
}

export const CreateFlpOnFolderCreatedHandler = FolderAfterCreateEventHandler.createImplementation({
    implementation: CreateFlpOnFolderCreatedHandlerImpl,
    dependencies: [IdentityContext, TaskService, Logger]
});
