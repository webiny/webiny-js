import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { ElasticsearchBoolQueryConfig } from "~/types";
import { ContextInterface } from "@webiny/handler/types";

export interface ModifyQueryParams<T extends ContextInterface> {
    context: T;
    query: ElasticsearchBoolQueryConfig;
}

interface Callable<T extends ContextInterface> {
    (params: ModifyQueryParams<T>): void;
}

export abstract class ElasticsearchQueryModifierPlugin<
    C extends ContextInterface = ContextInterface
> extends Plugin {
    private readonly callable?: Callable<C>;

    public constructor(callable?: Callable<C>) {
        super();
        this.callable = callable;
    }

    public modifyQuery<T extends ContextInterface = ContextInterface>(
        params: ModifyQueryParams<T>
    ): void {
        this.exec(params);
    }

    private exec(params: any): void {
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
