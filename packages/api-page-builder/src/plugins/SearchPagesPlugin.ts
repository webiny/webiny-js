import { Plugin } from "@webiny/plugins";
import {
    ElasticsearchBoolQueryConfig,
    Sort as esSort
} from "@webiny/api-elasticsearch/types";
import { PbContext } from "~/graphql/types";

interface ModifyQueryArgs {
    query: ElasticsearchBoolQueryConfig;
    args: Record<string, any>;
    context: PbContext;
}

interface ModifySortArgs {
    sort: esSort;
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
