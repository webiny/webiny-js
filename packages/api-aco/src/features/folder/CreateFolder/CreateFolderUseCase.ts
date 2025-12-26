import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import { createImplementation } from "@webiny/di";
import {
    CreateFolderUseCase as UseCaseAbstraction,
    CreateFolderRepository
} from "./abstractions.js";
import { FolderBeforeCreateEvent, FolderAfterCreateEvent } from "./events.js";
import type { Folder, CreateFolderParams } from "~/folder/folder.types.js";

class CreateFolderUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private repository: CreateFolderRepository.Interface
    ) {}

    async execute(params: CreateFolderParams): Promise<Result<Folder, UseCaseAbstraction.Error>> {
        // Publish before create event
        const beforeCreateEvent = new FolderBeforeCreateEvent({
            input: params
        });

        await this.eventPublisher.publish(beforeCreateEvent);

        // Execute the create operation
        const result = await this.repository.execute(params);

        if (result.isFail()) {
            return result;
        }

        const folder = result.value;

        // Publish after create event
        const afterCreateEvent = new FolderAfterCreateEvent({
            folder
        });

        await this.eventPublisher.publish(afterCreateEvent);

        return Result.ok(folder);
    }
}

export const CreateFolderUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: CreateFolderUseCaseImpl,
    dependencies: [EventPublisher, CreateFolderRepository]
});
