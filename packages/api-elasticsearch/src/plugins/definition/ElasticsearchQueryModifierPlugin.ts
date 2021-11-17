import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { ElasticsearchBoolQueryConfig } from "~/types";

export interface ModifyQueryParams {
    query: ElasticsearchBoolQueryConfig;
    where: Record<string, any>;
}

export interface ModifyQueryCallable<T extends ModifyQueryParams> {
    (params: T): void;
}

export abstract class ElasticsearchQueryModifierPlugin<
    T extends ModifyQueryParams = ModifyQueryParams
> extends Plugin {
    private readonly callable?: ModifyQueryCallable<T>;

    public constructor(callable?: ModifyQueryCallable<T>) {
        super();
        this.callable = callable;
    }

    public modifyQuery(params: T): void {
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
