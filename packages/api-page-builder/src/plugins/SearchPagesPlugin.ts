import { Plugin } from "@webiny/plugins";
import {
    ElasticsearchQuery,
    ElasticsearchSort
} from "@webiny/api-plugin-elastic-search-client/types";
import { PbContext } from "~/graphql/types";

interface ModifyQueryArgs {
    query: ElasticsearchQuery;
    args: Record<string, any>;
    context: PbContext;
}

interface ModifySortArgs {
    sort: ElasticsearchSort;
    args: Record<string, any>;
    context: PbContext;
}

interface Config {
    modifyQuery?(args: ModifyQueryArgs): void;
    modifySort?(args: ModifySortArgs): void;
}

export abstract class SearchPagesPlugin extends Plugin {
    private config: Config;

    constructor(config: Config) {
        super();
        this.config = config;
    }

    modifyQuery(args: ModifyQueryArgs) {
        if (typeof this.config.modifyQuery === "function") {
            this.config.modifyQuery(args);
        }
    }

    modifySort(args: ModifySortArgs) {
        if (typeof this.config.modifySort === "function") {
            this.config.modifySort(args);
        }
    }
}
