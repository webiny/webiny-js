import { Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/EventPublisher";
import {
    DeleteFolderUseCase as UseCaseAbstraction,
    DeleteFolderRepository
} from "./abstractions.js";
import { GetFolderRepository } from "../GetFolder/abstractions.js";
import { FolderBeforeDeleteEvent, FolderAfterDeleteEvent } from "./events.js";
import { createImplementation } from "@webiny/di";
import { FolderNotAuthorizedError, FolderNotEmptyError } from "~/domain/folder/errors.js";

class DeleteFolderUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private eventPublisher: EventPublisherAbstraction.Interface,
        private getFolderRepository: GetFolderRepository.Interface,
        private repository: DeleteFolderRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        // Get the folder before deletion
        const getFolderResult = await this.getFolderRepository.execute(id);

        if (getFolderResult.isFail()) {
            return Result.fail(getFolderResult.error);
        }

        const folder = getFolderResult.value;

        // Publish before delete event
        const beforeDeleteEvent = new FolderBeforeDeleteEvent({
            folder
        });

        try {
            await this.eventPublisher.publish(beforeDeleteEvent);
        } catch (err) {
            if (err.code === "Aco/Folder/NotEmpty") {
                return Result.fail(new FolderNotEmptyError());
            }
            return Result.fail(new FolderNotAuthorizedError());
        }

        // Execute the delete operation
        const result = await this.repository.execute(folder);

        if (result.isFail()) {
            return result;
        }

        // Publish after delete event
        const afterDeleteEvent = new FolderAfterDeleteEvent({
            folder
        });

        await this.eventPublisher.publish(afterDeleteEvent);

        return Result.ok();
    }
}

export const DeleteFolderUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: DeleteFolderUseCaseImpl,
    dependencies: [EventPublisher, GetFolderRepository, DeleteFolderRepository]
});
