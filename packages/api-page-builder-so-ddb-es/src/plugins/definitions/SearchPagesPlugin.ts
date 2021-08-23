import { Plugin } from "@webiny/plugins";
import { ElasticsearchBoolQueryConfig, Sort as esSort } from "@webiny/api-elasticsearch/types";
import { PbContext } from "@webiny/api-page-builder/graphql/types";

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
    private readonly config: Config;

    public constructor(config: Config) {
        super();
        this.config = config;
    }

    public modifyQuery(args: ModifyQueryArgs): void {
        if (typeof this.config.modifyQuery !== "function") {
            return;
        }
        this.config.modifyQuery(args);
    }

    public modifySort(args: ModifySortArgs): void {
        if (typeof this.config.modifySort !== "function") {
            return;
        }
        this.config.modifySort(args);
    }
}
