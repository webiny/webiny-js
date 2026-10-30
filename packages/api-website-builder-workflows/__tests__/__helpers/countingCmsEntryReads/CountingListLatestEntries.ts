import type { Container } from "@webiny/di";
import type {
    CmsEntryListParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { cmsEntryReads } from "./cmsEntryReads.js";

class CountingListLatestEntries implements ListLatestEntriesUseCase.Interface {
    public constructor(private decoratee: ListLatestEntriesUseCase.Interface) {}

    public execute<T extends CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ): ListLatestEntriesUseCase.Return<T> {
        cmsEntryReads.listLatestEntries++;
        return this.decoratee.execute<T>(model, params);
    }
}

/** Counts every `ListLatestEntriesUseCase` call into `cmsEntryReads`. */
export const countListLatestEntriesReads = (container: Container): void => {
    container.registerDecorator(
        ListLatestEntriesUseCase.createDecorator({
            decorator: CountingListLatestEntries,
            dependencies: []
        })
    );
};
