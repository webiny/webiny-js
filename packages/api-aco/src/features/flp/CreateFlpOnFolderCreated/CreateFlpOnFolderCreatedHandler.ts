import { CreateFlpUseCase } from "../CreateFlp/abstractions.js";
import { FolderAfterCreateEventHandler } from "~/features/folder/CreateFolder/abstractions.js";
import type { FolderAfterCreateEvent } from "~/features/folder/CreateFolder/events.js";
import type { ICreateFlpTaskInput } from "~/types.js";
import { CREATE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { NotifyFolderChangeUseCase } from "~/features/ai/NotifyFolderChange/index.js";

/*
 * Folder reads report permissions from the FLP record, so the admin is told about a new folder only
 * once that record exists. With a task service the record is written later, by the task, so the
 * task does the telling; without one it is written here, and so is the message.
 */
class CreateFlpOnFolderCreatedHandlerImpl implements FolderAfterCreateEventHandler.Interface {
    constructor(
        private createFlpUseCase: CreateFlpUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private notifyFolderChange: NotifyFolderChangeUseCase.Interface,
        private tasks?: TaskService.Interface
    ) {}

    async handle(event: FolderAfterCreateEvent): Promise<void> {
        const { folder } = event.payload;
        // Nobody to tell when there is no identity, as in some system calls.
        const notifyIdentityId = this.identityContext.getIdentity()?.id;

        try {
            if (this.tasks) {
                await this.tasks.trigger<ICreateFlpTaskInput>({
                    definition: CREATE_FLP_TASK_ID,
                    input: { folder, notifyIdentityId }
                });
            } else {
                await this.createFlpUseCase.execute(folder);
                if (notifyIdentityId) {
                    await this.notifyFolderChange.execute({
                        id: folder.id,
                        change: "created",
                        identityId: notifyIdentityId
                    });
                }
            }
        } catch {
            // Ignore errors
        }
    }
}

export const CreateFlpOnFolderCreatedHandler = FolderAfterCreateEventHandler.createImplementation({
    implementation: CreateFlpOnFolderCreatedHandlerImpl,
    dependencies: [
        CreateFlpUseCase,
        IdentityContext,
        NotifyFolderChangeUseCase,
        [TaskService, { optional: true }]
    ]
});
