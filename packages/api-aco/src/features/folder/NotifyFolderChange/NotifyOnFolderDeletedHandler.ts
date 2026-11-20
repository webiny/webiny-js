import { FolderAfterDeleteEventHandler } from "~/features/folder/DeleteFolder/abstractions.js";
import type { FolderAfterDeleteEvent } from "~/features/folder/DeleteFolder/events.js";
import { NotifyRecordChangeUseCase } from "@webiny/api-core/features/websockets/index.js";
import { FOLDER_RECORD_TYPE } from "./recordType.js";

/*
 * Created and updated folders are announced by the FLP tasks, once the admin can read them back. A
 * deleted folder is only dropped from the admin's cache, so there is nothing to wait for.
 */
class NotifyOnFolderDeletedHandlerImpl implements FolderAfterDeleteEventHandler.Interface {
    constructor(private notifyRecordChange: NotifyRecordChangeUseCase.Interface) {}

    async handle(event: FolderAfterDeleteEvent): Promise<void> {
        await this.notifyRecordChange.execute({
            type: FOLDER_RECORD_TYPE,
            id: event.payload.folder.id,
            change: "deleted"
        });
    }
}

export const NotifyOnFolderDeletedHandler = FolderAfterDeleteEventHandler.createImplementation({
    implementation: NotifyOnFolderDeletedHandlerImpl,
    dependencies: [NotifyRecordChangeUseCase]
});
