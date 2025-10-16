import { EventPublisher as EventPublisherAbstraction } from "@webiny/api-core";
import { DeleteFolderUseCase as UseCaseAbstraction } from "./abstractions.js";
import { FolderBeforeDeleteEvent, FolderAfterDeleteEvent } from "./events.js";
import type { DeleteFolderParams, AcoFolderStorageOperations } from "~/folder/folder.types.js";

export class DeleteFolderUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private storageOperations: AcoFolderStorageOperations
    ) {}

    async execute(params: DeleteFolderParams): Promise<boolean> {
        // Get the folder before deletion
        const folder = await this.storageOperations.getFolder({ id: params.id });

        // Publish before delete event
        const beforeDeleteEvent = new FolderBeforeDeleteEvent({
            folder
        });

        await this.eventPublisher.publish(beforeDeleteEvent);

        // Execute the delete operation
        await this.storageOperations.deleteFolder(params);

        // Publish after delete event
        const afterDeleteEvent = new FolderAfterDeleteEvent({
            folder
        });

        await this.eventPublisher.publish(afterDeleteEvent);

        return true;
    }
}
