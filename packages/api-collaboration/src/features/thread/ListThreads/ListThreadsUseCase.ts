import { Result } from "@webiny/feature/api";
import { ListThreadsRepository, ListThreadsUseCase as UseCase } from "./abstractions.js";
import { ResolveLocatorUseCase } from "~/features/locator/ResolveLocator/index.js";
import type { ICollabThreadView } from "~/features/thread/shared/abstractions.js";

class ListThreadsUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ListThreadsRepository.Interface,
        private resolveLocator: ResolveLocatorUseCase.Interface
    ) {}

    async execute(params: UseCase.Params): UseCase.Return {
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

        return Result.ok({ items: views, meta });
    }
}

export const ListThreadsUseCase = UseCase.createImplementation({
    implementation: ListThreadsUseCaseImpl,
    dependencies: [ListThreadsRepository, ResolveLocatorUseCase]
});
