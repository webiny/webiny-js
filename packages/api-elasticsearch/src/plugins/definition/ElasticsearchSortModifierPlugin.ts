import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { Sort } from "elastic-ts";

export interface ModifySortParams {
    sort: Sort;
}

export interface ModifySortCallable<T extends ModifySortParams> {
    (params: T): void;
}

export abstract class ElasticsearchSortModifierPlugin<
    T extends ModifySortParams = ModifySortParams
> extends Plugin {
    private readonly callable?: ModifySortCallable<T>;

    public constructor(callable?: ModifySortCallable<T>) {
        super();
        this.callable = callable;
    }

    public modifySort(params: T): void {
        if (typeof this.callable !== "function") {
            throw new WebinyError(
                `Missing modification for the sort.`,
                "SORT_MODIFICATION_MISSING",
                {
                    params
                }
            );
        }
        this.callable(params);
    }
}
