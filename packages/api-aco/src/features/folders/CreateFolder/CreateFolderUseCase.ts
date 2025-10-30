import { EventPublisher, EventPublisher as EventPublisherAbstraction } from "@webiny/api-core/features/EventPublisher";
import { createImplementation } from "@webiny/di-container";
import { CreateFolderUseCase as UseCaseAbstraction } from "./abstractions.js";
import { FolderBeforeCreateEvent, FolderAfterCreateEvent } from "./events.js";
import type {
    Folder,
    CreateFolderParams,
    AcoFolderStorageOperations
} from "~/folder/folder.types.js";
import { FolderStorageOperations } from "~/features/folders/shared/abstractions.js";

class CreateFolderUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private storageOperations: AcoFolderStorageOperations
    ) {}

    async execute(params: CreateFolderParams): Promise<Folder> {
        // Publish before create event
        const beforeCreateEvent = new FolderBeforeCreateEvent({
            input: params
        });

        await this.eventPublisher.publish(beforeCreateEvent);

        // Execute the create operation
        const folder = await this.storageOperations.createFolder({ data: params });

        // Publish after create event
        const afterCreateEvent = new FolderAfterCreateEvent({
            folder
        });

        await this.eventPublisher.publish(afterCreateEvent);

        return folder;
    }
}

export const CreateFolderUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: CreateFolderUseCaseImpl,
    dependencies: [EventPublisher, FolderStorageOperations]
});
