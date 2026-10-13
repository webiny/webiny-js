import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { UpdateFlpUseCase } from "../UpdateFlp/abstractions.js";
import type { FolderAfterUpdateEvent } from "~/features/folder/UpdateFolder/events.js";
import type { IUpdateFlpTaskInput } from "~/types.js";
import { UPDATE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { FolderAfterUpdateEventHandler } from "~/features/folder/UpdateFolder/index.js";
import { NotifyFolderChangeUseCase } from "~/features/ai/NotifyFolderChange/index.js";

/*
 * Folder reads report permissions from the FLP records, and a change rewrites the folder's record
 * and every descendant's. So the admin is told only once all of them are written: by the task when
 * there is a task service, or here when the update runs inline.
 */
class UpdateFlpOnFolderUpdatedHandlerImpl implements FolderAfterUpdateEventHandler.Interface {
    constructor(
        private updateFlpUseCase: UpdateFlpUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private notifyFolderChange: NotifyFolderChangeUseCase.Interface,
        private tasks?: TaskService.Interface
    ) {}

    async handle(event: FolderAfterUpdateEvent): Promise<void> {
        const { folder } = event.payload;
        // Nobody to tell when there is no identity, as in some system calls.
        const notifyIdentityId = this.identityContext.getIdentity()?.id;

        try {
            if (this.tasks) {
                await this.tasks.trigger<IUpdateFlpTaskInput>({
                    definition: UPDATE_FLP_TASK_ID,
                    input: { folder, notifyIdentityId }
                });
            } else {
                await this.updateFlpUseCase.execute({ folder });
                if (notifyIdentityId) {
                    await this.notifyFolderChange.execute({
                        id: folder.id,
                        change: "updated",
                        identityId: notifyIdentityId
                    });
                }
            }
        } catch {
            // Ignore errors
        }
    }
}

export const UpdateFlpOnFolderUpdatedHandler = FolderAfterUpdateEventHandler.createImplementation({
    implementation: UpdateFlpOnFolderUpdatedHandlerImpl,
    dependencies: [
        UpdateFlpUseCase,
        IdentityContext,
        NotifyFolderChangeUseCase,
        [TaskService, { optional: true }]
    ]
});
