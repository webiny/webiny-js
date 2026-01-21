import { createImplementation, Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import {
    UpdateFolderRepository,
    UpdateFolderUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { GetFolderRepository } from "../GetFolder/abstractions.js";
import { FolderAfterUpdateEvent, FolderBeforeUpdateEvent } from "./events.js";
import type { Folder, UpdateFolderParams } from "~/folder/folder.types.js";

class UpdateFolderUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getFolderRepository: GetFolderRepository.Interface,
        private repository: UpdateFolderRepository.Interface
    ) {}

    async execute(
        id: string,
        input: UpdateFolderParams
    ): Promise<Result<Folder, UseCaseAbstraction.Error>> {
        const useCaseInput = { id, data: input };

        // Get original folder for events
        const originalResult = await this.getFolderRepository.execute(id);

        if (originalResult.isFail()) {
            return originalResult;
        }

        const original = originalResult.value;

        // Publish before update event
        const beforeUpdateEvent = new FolderBeforeUpdateEvent({
            original,
            input: useCaseInput
        });

        await this.eventPublisher.publish(beforeUpdateEvent);

        // Execute the update operation
        const result = await this.repository.execute(id, input);

        if (result.isFail()) {
            return result;
        }

        const folder = result.value;

        // Publish after update event
        const afterUpdateEvent = new FolderAfterUpdateEvent({
            original,
            folder,
            input: useCaseInput
        });

        await this.eventPublisher.publish(afterUpdateEvent);

        return Result.ok(folder);
    }
}

export const UpdateFolderUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: UpdateFolderUseCaseImpl,
    dependencies: [EventPublisher, GetFolderRepository, UpdateFolderRepository]
});
