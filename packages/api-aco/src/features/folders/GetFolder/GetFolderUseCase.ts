import { EventPublisher as EventPublisherAbstraction } from "@webiny/api-core";
import { GetFolderUseCase as UseCaseAbstraction } from "./abstractions.js";
import { FolderBeforeGetEvent, FolderAfterGetEvent } from "./events.js";
import type { Folder, GetFolderParams, AcoFolderStorageOperations } from "~/folder/folder.types.js";

export class GetFolderUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private storageOperations: AcoFolderStorageOperations
    ) {}

    async execute(params: GetFolderParams): Promise<Folder> {
        // Publish before get event
        const beforeGetEvent = new FolderBeforeGetEvent({
            params
        });

        await this.eventPublisher.publish(beforeGetEvent);

        // Execute the get operation
        const folder = await this.storageOperations.getFolder(params);

        // Publish after get event
        const afterGetEvent = new FolderAfterGetEvent({
            folder
        });

        await this.eventPublisher.publish(afterGetEvent);

        return folder;
    }
}
