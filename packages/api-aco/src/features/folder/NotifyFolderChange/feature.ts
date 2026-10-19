import { createFeature } from "@webiny/feature/api";
import { NotifyFolderChangeUseCase } from "./NotifyFolderChangeUseCase.js";
import { NotifyOnFolderDeletedHandler } from "./NotifyOnFolderDeletedHandler.js";

/**
 * Tells the user's open admin tabs when a folder is created, updated or deleted. The FLP tasks send
 * created and updated (see `CreateFlpOnFolderCreated` and `UpdateFlpOnFolderUpdated`); deleted goes
 * out from here.
 */
export const NotifyFolderChangeFeature = createFeature({
    name: "NotifyFolderChange",
    register(container) {
        container.register(NotifyFolderChangeUseCase);
        container.register(NotifyOnFolderDeletedHandler);
    }
});
