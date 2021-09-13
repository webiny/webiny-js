import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { ContextInterface } from "@webiny/handler/types";
import { Sort } from "elastic-ts";

export interface ModifySortParams<T extends ContextInterface> {
    context: T;
    sort: Sort;
}

interface Callable<T extends ContextInterface> {
    (params: ModifySortParams<T>): void;
}

export abstract class ElasticsearchSortModifierPlugin<
    T extends ContextInterface = ContextInterface
> extends Plugin {
    private readonly callable?: Callable<T>;

    public constructor(callable?: Callable<T>) {
        super();
        this.callable = callable;
    }

    public modifySort(params: ModifySortParams<T>): void {
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
