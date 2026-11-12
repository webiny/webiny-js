import { createImplementation, Result } from "@webiny/feature/api";
import {
    EventPublisher,
    EventPublisher as EventPublisherAbstraction
} from "@webiny/api-core/features/eventPublisher/index.js";
import {
    UpdateFolderRepository,
    UpdateFolderUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { GetFolderRepository } from "../GetFolder/abstractions.js";
import { FolderAfterUpdateEvent, FolderBeforeUpdateEvent } from "./events.js";
import type { Folder, UpdateFolderParams } from "~/folder/folder.types.js";
import { FolderValidationError } from "~/domain/folder/errors.js";

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

        if (input.parentId && input.parentId !== original.parentId) {
            const moveResult = await this.ensureCanMoveInto(original, input.parentId);

            if (moveResult.isFail()) {
                return Result.fail(moveResult.error);
            }
        }

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

    /*
     * Either move would cut the folder's subtree off from the root. The admin's tree never offers
     * them, but any caller can pass an arbitrary parent id.
     *
     * The subtree check compares stored paths. A move writes the moved folder's own path at once
     * and its descendants' paths later, from the FLP update task, so a second move made before
     * that task finishes is checked against the old paths.
     */
    private async ensureCanMoveInto(
        folder: Folder,
        parentId: string
    ): Promise<Result<void, UseCaseAbstraction.Error>> {
        if (parentId === folder.id) {
            return Result.fail(new FolderValidationError("A folder cannot be moved into itself."));
        }

        const parentResult = await this.getFolderRepository.execute(parentId);

        if (parentResult.isFail()) {
            return Result.fail(parentResult.error);
        }

        const parent = parentResult.value;

        if (parent.path.startsWith(`${folder.path}/`)) {
            return Result.fail(
                new FolderValidationError(
                    `Folder "${parent.title}" is inside the folder being moved, so it cannot be its new parent.`
                )
            );
        }

        return Result.ok();
    }
}

export const UpdateFolderUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: UpdateFolderUseCaseImpl,
    dependencies: [EventPublisher, GetFolderRepository, UpdateFolderRepository]
});
