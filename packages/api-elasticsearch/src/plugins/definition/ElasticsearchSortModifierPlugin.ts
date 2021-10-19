import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { Sort } from "elastic-ts";

export interface ModifySortParams {
    sort: Sort;
}

interface Callable {
    (params: ModifySortParams): void;
}

export abstract class ElasticsearchSortModifierPlugin extends Plugin {
    private readonly callable?: Callable;

    public constructor(callable?: Callable) {
        super();
        this.callable = callable;
    }

    public modifySort(params: ModifySortParams): void {
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
