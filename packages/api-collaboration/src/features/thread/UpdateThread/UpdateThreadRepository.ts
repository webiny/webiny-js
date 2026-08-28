import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import {
    CollabThreadModel,
    type ICollabThread,
    type ICollabThreadValues
} from "~/domain/thread/abstractions.js";
import { CollabThreadNotFoundError, CollabThreadPersistenceError } from "~/domain/thread/errors.js";
import { UpdateThreadRepository as Repository } from "./abstractions.js";

class UpdateThreadRepositoryImpl implements Repository.Interface {
    constructor(
        private updateEntry: UpdateEntryUseCase.Interface,
        private model: CollabThreadModel.Interface
    ) {}

    async execute(thread: ICollabThread): Repository.Return {
        const revisionId = createIdentifier({ id: thread.id, version: 1 });

        const values: ICollabThreadValues = {
            contentType: thread.contentType,
            contentId: thread.contentId,
            locator: thread.locator,
            type: thread.type,
            resolved: thread.resolved,
            resolvedBy: thread.resolvedBy ?? null,
            resolvedOn: thread.resolvedOn ?? null,
            assigneeId: thread.assigneeId ?? null,
            dueDate: thread.dueDate ?? null,
            messages: thread.messages,
            deleted: thread.deleted ?? false,
            deletedBy: thread.deletedBy ?? null,
            deletedOn: thread.deletedOn ?? null
        };

        try {
            const updateResult = await this.updateEntry.execute<ICollabThreadValues>(
                this.model,
                revisionId,
                { values }
            );

            if (updateResult.isFail()) {
                if (updateResult.error.code === "Cms/Entry/NotFound") {
                    return Result.fail(new CollabThreadNotFoundError({ id: thread.id }));
                }
                return Result.fail(new CollabThreadPersistenceError(updateResult.error));
            }

            return Result.ok(thread);
        } catch (error) {
            return Result.fail(new CollabThreadPersistenceError(error as Error));
        }
    }
}

export const UpdateThreadRepository = Repository.createImplementation({
    implementation: UpdateThreadRepositoryImpl,
    dependencies: [UpdateEntryUseCase, CollabThreadModel]
});
