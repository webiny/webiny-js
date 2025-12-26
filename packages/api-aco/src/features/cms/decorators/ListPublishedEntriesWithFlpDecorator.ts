import { createDecorator } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ListPublishedEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryListParams
} from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { ListEntriesFactory } from "~/utils/decorators/ListEntriesFactory.js";

class ListPublishedEntriesWithFlpDecoratorImpl implements ListPublishedEntriesUseCase.Interface {
    private readonly listEntriesHandler: ListEntriesFactory;

    constructor(
        folderLevelPermissions: FolderLevelPermissions.Interface,
        private decoratee: ListPublishedEntriesUseCase.Interface
    ) {
        this.listEntriesHandler = new ListEntriesFactory(folderLevelPermissions);
    }

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): ListPublishedEntriesUseCase.Return<T> {
        const loader = async (params?: CmsEntryListParams) => {
            const result = await this.decoratee.execute<T>(model, params);
            return result.value;
        };

        const { entries, meta } = await this.listEntriesHandler.execute<T>({
            model,
            dataLoader: loader,
            initialParams: params
        });

        return Result.ok({ entries, meta });
    }
}

export const ListPublishedEntriesWithFlpDecorator = createDecorator({
    abstraction: ListPublishedEntriesUseCase,
    decorator: ListPublishedEntriesWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions]
});
