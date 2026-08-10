import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { CmsModelOpenSearchIndexProvider } from "~/features/CmsModelOpenSearchIndex/CmsModelOpenSearchIndexProvider.js";
import { CmsEntryOpenSearchIndexDelete as CmsEntryOpenSearchIndexDeleteAbstraction } from "./abstractions.js";
import { createConfigurations } from "~/configurations.js";

class CmsEntryOpenSearchIndexDeleteImpl
    implements CmsEntryOpenSearchIndexDeleteAbstraction.Interface
{
    public constructor(
        private readonly openSearchClient: OpenSearchClient.Interface,
        private readonly indexProvider: CmsModelOpenSearchIndexProvider.Interface
    ) {}

    public async execute(params: CmsEntryOpenSearchIndexDeleteAbstraction.Params): Promise<void> {
        const { model } = params;

        const configurations = createConfigurations(this.indexProvider);
        const { index, shared } = await configurations.es({ model });
        if (shared) {
            return;
        }
        const client = this.openSearchClient.use();

        const { body: exists } = await client.indices.exists({ index });
        if (!exists) {
            return;
        }

        try {
            await client.indices.delete({
                index,
                ignore_unavailable: true
            });
        } catch (ex) {
            console.log(`Could not delete Elasticsearch index "${index}". Please do it manually.`);
            console.log(ex.message);
        }
    }
}

export const CmsEntryOpenSearchIndexDelete =
    CmsEntryOpenSearchIndexDeleteAbstraction.createImplementation({
        implementation: CmsEntryOpenSearchIndexDeleteImpl,
        dependencies: [OpenSearchClient, CmsModelOpenSearchIndexProvider]
    });
