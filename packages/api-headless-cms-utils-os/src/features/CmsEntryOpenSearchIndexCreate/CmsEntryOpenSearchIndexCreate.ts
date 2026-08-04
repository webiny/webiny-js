import WebinyError from "@webiny/error";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { CmsModelOpenSearchIndexProvider } from "~/features/CmsModelOpenSearchIndex/CmsModelOpenSearchIndexProvider.js";
import { CmsEntryOpenSearchIndexCreate as CmsEntryOpenSearchIndexCreateAbstraction } from "./abstractions.js";
import { createConfigurations } from "~/configurations.js";

class CmsEntryOpenSearchIndexCreateImpl
    implements CmsEntryOpenSearchIndexCreateAbstraction.Interface
{
    public constructor(
        private readonly openSearchClient: OpenSearchClient.Interface,
        private readonly indexProvider: CmsModelOpenSearchIndexProvider.Interface
    ) {}

    public async execute(params: CmsEntryOpenSearchIndexCreateAbstraction.Params): Promise<void> {
        const { model } = params;
        const client = this.openSearchClient.use();

        const configurations = createConfigurations(this.indexProvider);
        const { index, settings } = await configurations.es({ model });

        try {
            const response = await client.indices.exists({
                index,
                ignore_unavailable: false,
                allow_no_indices: true,
                include_defaults: true,
                flat_settings: false,
                local: false
            });
            if (response.body) {
                console.log(
                    `Elasticsearch index "${index}" for the CMS model "${model.name}" already exists.`
                );
                return;
            }
        } catch {
            console.error(`Could not determine if the index "${index}" exists.`);
        }

        try {
            await client.indices.create({
                index,
                body: {
                    ...settings
                }
            });
        } catch (ex) {
            console.error(
                `Could not create Elasticsearch index "${index}" for the CMS model "${model.name}".`
            );
            console.error(ex);
            throw new WebinyError(
                ex.message || "Could not create OpenSearch index for the CMS entry.",
                ex.code || "CREATE_OPENSEARCH_INDEX_ERROR",
                {
                    error: {
                        ...ex,
                        message: ex.message,
                        code: ex.code,
                        data: ex.data
                    },
                    tenant: model.tenant,
                    index,
                    body: settings
                }
            );
        }
    }
}

export const CmsEntryOpenSearchIndexCreate =
    CmsEntryOpenSearchIndexCreateAbstraction.createImplementation({
        implementation: CmsEntryOpenSearchIndexCreateImpl,
        dependencies: [OpenSearchClient, CmsModelOpenSearchIndexProvider]
    });
