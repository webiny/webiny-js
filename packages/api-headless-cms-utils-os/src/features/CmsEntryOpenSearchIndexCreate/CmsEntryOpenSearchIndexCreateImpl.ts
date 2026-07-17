import WebinyError from "@webiny/error";
import { configurations } from "~/configurations.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { CmsEntryOpenSearchIndex } from "~/features/CmsEntryOpenSearchIndex/index.js";
import { CmsEntryOpenSearchIndexCreate } from "./abstractions.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

const getLastUsable = (
    configs: CmsEntryOpenSearchIndex.Interface[],
    model: CmsModel
): CmsEntryOpenSearchIndex.Interface => {
    const usable = configs.filter(c => c.canUse({ model }));
    if (usable.length === 0) {
        throw new WebinyError(
            "Could not find a single usable CmsEntryOpenSearchIndex.",
            "OPENSEARCH_INDEX_TEMPLATE_ERROR"
        );
    }
    return usable[usable.length - 1];
};

class CmsEntryOpenSearchIndexCreateClass implements CmsEntryOpenSearchIndexCreate.Interface {
    public constructor(
        private readonly openSearchClient: OpenSearchClient.Interface,
        private readonly indexConfigs: CmsEntryOpenSearchIndex.Interface[]
    ) {}

    public async execute(params: CmsEntryOpenSearchIndexCreate.Params): Promise<void> {
        const { model } = params;
        const client = this.openSearchClient.use();

        const { index } = configurations.es({ model });

        const config = getLastUsable(this.indexConfigs, model);
        if (!config) {
            throw new Error(
                `Could not find a usable CmsEntryOpenSearchIndex for the CMS model "${model.name}".`
            );
        }

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
                    ...config.body
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
                    body: config.body
                }
            );
        }
    }
}

export const CmsEntryOpenSearchIndexCreateImpl =
    CmsEntryOpenSearchIndexCreate.createImplementation({
        implementation: CmsEntryOpenSearchIndexCreateClass,
        dependencies: [OpenSearchClient, [CmsEntryOpenSearchIndex, { multiple: true }]]
    });
