import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetThreadRepository, GetThreadUseCase as UseCase } from "./abstractions.js";
import { ResolveLocatorUseCase } from "~/api/features/locator/ResolveLocator/index.js";
import { CollabThreadNotAuthorizedError } from "~/api/domain/thread/errors.js";

class GetThreadUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: GetThreadRepository.Interface,
        private resolveLocator: ResolveLocatorUseCase.Interface
    ) {}

    async execute(id: string): UseCase.Return {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return Result.fail(new CollabThreadNotAuthorizedError());
        }

        const threadResult = await this.repository.execute(id);
        if (threadResult.isFail()) {
            return Result.fail(threadResult.error);
        }

        const thread = threadResult.value;

        const resolution = await this.resolveLocator.execute({
            contentType: thread.contentType,
            contentId: thread.contentId,
            locator: thread.locator
        });

        // Access to a thread equals read access to its target content. Without a resolver we
        // cannot verify access, so we deny.
        if (resolution.isFail() || !resolution.value.authorized) {
            return Result.fail(
                new CollabThreadNotAuthorizedError(
                    "You do not have access to this collaboration thread."
                )
            );
        }

        return Result.ok({ thread, anchor: resolution.value });
    }
}

export const GetThreadUseCase = UseCase.createImplementation({
    implementation: GetThreadUseCaseImpl,
    dependencies: [IdentityContext, GetThreadRepository, ResolveLocatorUseCase]
});
