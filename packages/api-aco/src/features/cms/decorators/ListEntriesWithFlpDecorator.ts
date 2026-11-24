import { createDecorator, Result } from "@webiny/feature/api";
import { ListEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js";
import type {
    CmsEntryListParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { FolderAccessListFilter } from "~/features/flp/FolderAccessListFilter/index.js";

class ListEntriesWithFlpDecoratorImpl implements ListEntriesUseCase.Interface {
    constructor(
        private folderAccessListFilter: FolderAccessListFilter.Interface,
        private decoratee: ListEntriesUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): ListEntriesUseCase.Return<T> {
        const loader = async (params?: CmsEntryListParams) => {
            const result = await this.decoratee.execute<T>(model, params);
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        };

        const { entries, meta } = await this.folderAccessListFilter.listEntries<T>({
            model,
            params,
            loader
        });

        return Result.ok({ entries, meta });
    }
}

export const ListEntriesWithFlpDecorator = createDecorator({
    abstraction: ListEntriesUseCase,
    decorator: ListEntriesWithFlpDecoratorImpl,
    dependencies: [FolderAccessListFilter]
});
