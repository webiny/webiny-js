import { Result } from "@webiny/feature/api";
import { mdbid } from "@webiny/utils";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CreateThreadRepository, CreateThreadUseCase as UseCase } from "./abstractions.js";
import { ResolveLocatorUseCase } from "~/features/locator/ResolveLocator/index.js";
import { type ICollabMessage, type ICollabThreadValues } from "~/domain/thread/abstractions.js";
import {
    CollabAnchorNotFoundError,
    CollabThreadNotAuthorizedError,
    CollabThreadValidationError
} from "~/domain/thread/errors.js";
import { toCollabIdentity } from "~/utils/identity.js";

class CreateThreadUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private resolveLocator: ResolveLocatorUseCase.Interface,
        private repository: CreateThreadRepository.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return Result.fail(
                new CollabThreadNotAuthorizedError("You must be signed in to comment.")
            );
        }

        if (!input.body || input.body.trim().length === 0) {
            return Result.fail(new CollabThreadValidationError("Message body cannot be empty."));
        }

        const resolution = await this.resolveLocator.execute({
            contentType: input.contentType,
            contentId: input.contentId,
            locator: input.locator
        });

        if (resolution.isFail() || !resolution.value.authorized) {
            return Result.fail(
                new CollabThreadNotAuthorizedError(
                    "You do not have access to comment on this content."
                )
            );
        }

        if (!resolution.value.exists) {
            return Result.fail(
                new CollabAnchorNotFoundError({
                    contentType: input.contentType,
                    locator: input.locator
                })
            );
        }

        const now = new Date().toISOString();
        const author = toCollabIdentity(identity);

        const message: ICollabMessage = {
            id: mdbid(),
            body: input.body,
            mentions: input.mentions ?? [],
            createdBy: author,
            createdOn: now
        };

        const values: ICollabThreadValues = {
            contentType: input.contentType,
            contentId: input.contentId,
            locator: input.locator,
            type: input.type,
            resolved: false,
            resolvedBy: null,
            resolvedOn: null,
            assigneeId: input.assigneeId ?? null,
            dueDate: input.dueDate ?? null,
            messages: [message],
            deleted: false,
            deletedBy: null,
            deletedOn: null
        };

        const createResult = await this.repository.execute({ id: mdbid(), values });
        if (createResult.isFail()) {
            return Result.fail(createResult.error);
        }

        return Result.ok({ thread: createResult.value, anchor: resolution.value });
    }
}

export const CreateThreadUseCase = UseCase.createImplementation({
    implementation: CreateThreadUseCaseImpl,
    dependencies: [IdentityContext, ResolveLocatorUseCase, CreateThreadRepository]
});
