import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListThreadsRepository, ListThreadsUseCase as UseCase } from "./abstractions.js";
import { ResolveLocatorUseCase } from "~/api/features/locator/ResolveLocator/index.js";
import type { ICollabThreadView } from "~/api/features/thread/shared/abstractions.js";
import { CollabThreadNotAuthorizedError } from "~/api/domain/thread/errors.js";

class ListThreadsUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: ListThreadsRepository.Interface,
        private resolveLocator: ResolveLocatorUseCase.Interface
    ) {}

    async execute(params: UseCase.Params): UseCase.Return {
        if (this.identityContext.getIdentity().isAnonymous()) {
            return Result.fail(new CollabThreadNotAuthorizedError());
        }

        const listResult = await this.repository.execute(params);
        if (listResult.isFail()) {
            return Result.fail(listResult.error);
        }

        const { items, meta } = listResult.value;
        const views: ICollabThreadView[] = [];

        for (const thread of items) {
            const resolution = await this.resolveLocator.execute({
                contentType: thread.contentType,
                contentId: thread.contentId,
                locator: thread.locator
            });

            // Without read access to the target we omit the thread entirely.
            if (resolution.isFail() || !resolution.value.authorized) {
                continue;
            }

            views.push({ thread, anchor: resolution.value });
        }

        // Security: the meta must not reveal the threads that were left out.
        const omitted = items.length - views.length;
        if (omitted > 0 && views.length === 0) {
            return Result.ok({
                items: views,
                meta: { totalCount: 0, hasMoreItems: false, cursor: null }
            });
        }

        return Result.ok({
            items: views,
            meta: { ...meta, totalCount: Math.max(meta.totalCount - omitted, 0) }
        });
    }
}

export const ListThreadsUseCase = UseCase.createImplementation({
    implementation: ListThreadsUseCaseImpl,
    dependencies: [IdentityContext, ListThreadsRepository, ResolveLocatorUseCase]
});
