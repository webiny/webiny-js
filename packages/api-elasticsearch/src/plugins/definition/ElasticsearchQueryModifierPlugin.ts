import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { ElasticsearchBoolQueryConfig } from "~/types";

export interface ModifyQueryParams {
    query: ElasticsearchBoolQueryConfig;
    where: Record<string, any>;
}

interface Callable {
    (params: ModifyQueryParams): void;
}

export abstract class ElasticsearchQueryModifierPlugin extends Plugin {
    private readonly callable?: Callable;

    public constructor(callable?: Callable) {
        super();
        this.callable = callable;
    }

    public modifyQuery(params: ModifyQueryParams): void {
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
