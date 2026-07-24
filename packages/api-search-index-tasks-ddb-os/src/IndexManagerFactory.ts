import { OsIndexManager } from "~/IndexManager.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { DisableIndexing } from "~/settings/abstractions/DisableIndexing.js";
import { EnableIndexing } from "~/settings/abstractions/EnableIndexing.js";
import { IndexManagerFactory as Abstraction } from "@webiny/api-search-index-tasks/abstractions/IndexManagerFactory.js";

class IndexManagerFactoryImpl implements Abstraction.Interface {
    public constructor(
        private readonly openSearchClient: OpenSearchClient.Interface,
        private readonly disableIndexing: DisableIndexing.Interface,
        private readonly enableIndexing: EnableIndexing.Interface
    ) {}

    public createIndexManager(params: Abstraction.Params) {
        return new OsIndexManager(
            this.openSearchClient.use(),
            this.disableIndexing,
            this.enableIndexing,
            params.settings,
            params.defaults
        );
    }
}

export const IndexManagerFactory = Abstraction.createImplementation({
    implementation: IndexManagerFactoryImpl,
    dependencies: [OpenSearchClient, DisableIndexing, EnableIndexing]
});
