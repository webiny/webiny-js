import type { Container } from "@webiny/di";
import type { CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetEntriesByIdsUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntriesByIds/index.js";
import { cmsEntryReads } from "./cmsEntryReads.js";

class CountingGetEntriesByIds implements GetEntriesByIdsUseCase.Interface {
    public constructor(private decoratee: GetEntriesByIdsUseCase.Interface) {}

    public execute<T extends CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): GetEntriesByIdsUseCase.Return<T> {
        cmsEntryReads.getEntriesByIds++;
        return this.decoratee.execute<T>(model, ids);
    }
}

/** Counts every `GetEntriesByIdsUseCase` call into `cmsEntryReads`. */
export const countGetEntriesByIdsReads = (container: Container): void => {
    container.registerDecorator(
        GetEntriesByIdsUseCase.createDecorator({
            decorator: CountingGetEntriesByIds,
            dependencies: []
        })
    );
};
