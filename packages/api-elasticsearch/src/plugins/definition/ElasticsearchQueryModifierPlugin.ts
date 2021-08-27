import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ContextInterface } from "@webiny/handler/types";

export interface ModifyQueryParams<T extends ContextInterface> {
    context: T;
    query: ElasticsearchBoolQueryConfig;
    where: Record<string, any>;
}

interface Callable<T extends ContextInterface> {
    (params: ModifyQueryParams<T>): void;
}

export abstract class ElasticsearchQueryModifierPlugin<
    T extends ContextInterface = ContextInterface
> extends Plugin {
    private readonly callable?: Callable<T>;

    public constructor(callable?: Callable<T>) {
        super();
        this.callable = callable;
    }

    public modifyQuery(params: ModifyQueryParams<T>): void {
        if (typeof this.callable !== "function") {
            throw new WebinyError(
                `Missing modification for the query.`,
                "QUERY_MODIFICATION_MISSING",
                {
                    params
                }
            );
        }
        this.callable(params);
    }
}
