import { configurations } from "~/configurations.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { CmsEntryOpenSearchIndexDelete } from "./abstractions.js";

class CmsEntryOpenSearchIndexDeleteClass implements CmsEntryOpenSearchIndexDelete.Interface {
    public constructor(private readonly openSearchClient: OpenSearchClient.Interface) {}

    public async execute(params: CmsEntryOpenSearchIndexDelete.Params): Promise<void> {
        const { model } = params;
        const client = this.openSearchClient.use();

        const { index } = configurations.es({ model });

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
            console.log(
                `Could not delete Elasticsearch index "${index}". Please do it manually.`
            );
            console.log(ex.message);
        }
    }
}

export const CmsEntryOpenSearchIndexDeleteImpl =
    CmsEntryOpenSearchIndexDelete.createImplementation({
        implementation: CmsEntryOpenSearchIndexDeleteClass,
        dependencies: [OpenSearchClient]
    });
