import { createDecorator } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ListEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryListParams,
    CmsEntry,
    CmsEntryMeta
} from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { ListEntriesFactory } from "~/utils/decorators/ListEntriesFactory.js";

class ListEntriesWithFlpDecoratorImpl implements ListEntriesUseCase.Interface {
    private readonly listEntriesHandler: ListEntriesFactory;

    constructor(
        folderLevelPermissions: FolderLevelPermissions.Interface,
        private decoratee: ListEntriesUseCase.Interface
    ) {
        this.listEntriesHandler = new ListEntriesFactory(folderLevelPermissions);
    }

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): Promise<Result<[CmsEntry<T>[], CmsEntryMeta], ListEntriesUseCase.Error>> {
        const loader = async (params?: CmsEntryListParams) => {
            const result = await this.decoratee.execute(model, params);
            return result.value;
        };

        const [entries, meta] = await this.listEntriesHandler.execute({
            model,
            dataLoader: loader,
            initialParams: params
        });

        return Result.ok([entries, meta]) as Result<[CmsEntry<T>[], CmsEntryMeta]>;
    }
}

export const ListEntriesWithFlpDecorator = createDecorator({
    abstraction: ListEntriesUseCase,
    decorator: ListEntriesWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions]
});
