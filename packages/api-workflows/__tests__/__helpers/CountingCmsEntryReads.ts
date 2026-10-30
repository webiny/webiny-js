import type { Container } from "@webiny/feature/api";
import type {
    CmsEntryListParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { GetEntriesByIdsUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntriesByIds/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { GetUniqueFieldValuesUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetUniqueFieldValues/index.js";

/** Storage calls the CMS entry use cases made, of every model. Reset it per test. */
export interface CmsEntryReads {
    listLatestEntries: number;
    getEntriesByIds: number;
    getEntryById: number;
    getRevisionById: number;
    getUniqueFieldValues: number;
}

export const cmsEntryReads: CmsEntryReads = {
    listLatestEntries: 0,
    getEntriesByIds: 0,
    getEntryById: 0,
    getRevisionById: 0,
    getUniqueFieldValues: 0
};

export const resetCmsEntryReads = (): void => {
    cmsEntryReads.listLatestEntries = 0;
    cmsEntryReads.getEntriesByIds = 0;
    cmsEntryReads.getEntryById = 0;
    cmsEntryReads.getRevisionById = 0;
    cmsEntryReads.getUniqueFieldValues = 0;
};

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

class CountingGetEntryById implements GetEntryByIdUseCase.Interface {
    public constructor(private decoratee: GetEntryByIdUseCase.Interface) {}

    public execute<T extends CmsEntryValues>(
        model: CmsModel,
        id: string
    ): GetEntryByIdUseCase.Return<T> {
        cmsEntryReads.getEntryById++;
        return this.decoratee.execute<T>(model, id);
    }
}

class CountingGetRevisionById implements GetRevisionByIdUseCase.Interface {
    public constructor(private decoratee: GetRevisionByIdUseCase.Interface) {}

    public execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): GetRevisionByIdUseCase.Return<T> {
        cmsEntryReads.getRevisionById++;
        return this.decoratee.execute<T>(model, id);
    }
}

class CountingGetUniqueFieldValues implements GetUniqueFieldValuesUseCase.Interface {
    public constructor(private decoratee: GetUniqueFieldValuesUseCase.Interface) {}

    public execute(
        model: CmsModel,
        params: GetUniqueFieldValuesUseCase.Params
    ): GetUniqueFieldValuesUseCase.Return {
        cmsEntryReads.getUniqueFieldValues++;
        return this.decoratee.execute(model, params);
    }
}

/** Registers decorators that count the CMS entry reads into `cmsEntryReads`. */
export const countCmsEntryReads = (container: Container): void => {
    container.registerDecorator(
        ListLatestEntriesUseCase.createDecorator({
            decorator: CountingListLatestEntries,
            dependencies: []
        })
    );
    container.registerDecorator(
        GetEntriesByIdsUseCase.createDecorator({
            decorator: CountingGetEntriesByIds,
            dependencies: []
        })
    );
    container.registerDecorator(
        GetEntryByIdUseCase.createDecorator({
            decorator: CountingGetEntryById,
            dependencies: []
        })
    );
    container.registerDecorator(
        GetRevisionByIdUseCase.createDecorator({
            decorator: CountingGetRevisionById,
            dependencies: []
        })
    );
    container.registerDecorator(
        GetUniqueFieldValuesUseCase.createDecorator({
            decorator: CountingGetUniqueFieldValues,
            dependencies: []
        })
    );
};
