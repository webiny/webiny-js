import { EventPublisher as EventPublisherAbstraction } from "@webiny/api-core";
import { UpdateFolderUseCase as UseCaseAbstraction } from "./abstractions.js";
import { FolderBeforeUpdateEvent, FolderAfterUpdateEvent } from "./events.js";
import type {
    Folder,
    UpdateFolderParams,
    AcoFolderStorageOperations
} from "~/folder/folder.types.js";

export class UpdateFolderUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private storageOperations: AcoFolderStorageOperations
    ) {}

    async execute(id: string, input: UpdateFolderParams): Promise<Folder> {
        const useCaseInput = { id, data: input };
        const original = await this.storageOperations.getFolder({ id });

        // Publish before update event
        const beforeUpdateEvent = new FolderBeforeUpdateEvent({
            original,
            input: useCaseInput
        });

        await this.eventPublisher.publish(beforeUpdateEvent);

        // Execute the update operation
        const folder = await this.storageOperations.updateFolder({
            id,
            data: input
        });

        // Publish after update event
        const afterUpdateEvent = new FolderAfterUpdateEvent({
            original,
            folder,
            input: useCaseInput
        });

        await this.eventPublisher.publish(afterUpdateEvent);

        return folder;
    }
}
