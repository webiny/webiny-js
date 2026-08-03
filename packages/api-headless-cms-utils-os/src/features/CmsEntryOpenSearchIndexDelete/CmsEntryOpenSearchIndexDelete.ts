import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { CmsModelOpenSearchIndexProvider } from "~/features/CmsModelOpenSearchIndex/CmsModelOpenSearchIndexProvider.js";
import { CmsEntryOpenSearchIndexDelete as CmsEntryOpenSearchIndexDeleteAbstraction } from "./abstractions.js";
import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";

class CmsEntryOpenSearchIndexDeleteImpl
    implements CmsEntryOpenSearchIndexDeleteAbstraction.Interface
{
    public constructor(
        private readonly openSearchClient: OpenSearchClient.Interface,
        private readonly indexProvider: CmsModelOpenSearchIndexProvider.Interface
    ) {}

    public async execute(params: CmsEntryOpenSearchIndexDeleteAbstraction.Params): Promise<void> {
        const { model } = params;

        const { index: rawIndex, shared } = await this.indexProvider.execute({ model });
        if (shared) {
            return;
        }

        const prefix = getOpenSearchIndexPrefix();
        const index = prefix ? prefix + rawIndex : rawIndex;
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
