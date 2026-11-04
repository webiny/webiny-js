import { FolderAfterDeleteEventHandler } from "~/features/folder/DeleteFolder/abstractions.js";
import type { FolderAfterDeleteEvent } from "~/features/folder/DeleteFolder/events.js";
import { NotifyFolderChangeUseCase } from "./abstractions.js";

/*
 * Created and updated folders are announced by the FLP tasks, once the admin can read them back. A
 * deleted folder is only dropped from the admin's cache, so there is nothing to wait for.
 */
class NotifyOnFolderDeletedHandlerImpl implements FolderAfterDeleteEventHandler.Interface {
    constructor(private notifyFolderChange: NotifyFolderChangeUseCase.Interface) {}

    async handle(event: FolderAfterDeleteEvent): Promise<void> {
        try {
            await this.notifyFolderChange.execute({
                id: event.payload.folder.id,
                change: "deleted"
            });
        } catch {
            // The folder is gone either way; the admin drops it on its next reload.
        }
    }
}

export const NotifyOnFolderDeletedHandler = FolderAfterDeleteEventHandler.createImplementation({
    implementation: NotifyOnFolderDeletedHandlerImpl,
    dependencies: [NotifyFolderChangeUseCase]
});
