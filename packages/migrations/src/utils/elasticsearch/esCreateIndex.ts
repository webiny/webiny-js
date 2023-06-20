import WebinyError from "@webiny/error";
import { Client } from "@elastic/elasticsearch";
import { esGetIndexName, esGetIndexExist } from "~/utils";
import { elasticsearchIndexPlugins } from "~/utils/elasticsearch/plugins";

export interface EsCreateIndexParams {
    elasticsearchClient: Client;
    tenant: string;
    locale: string;
    type: string;
    isHeadlessCmsModel: boolean;
}

export const esCreateIndex = async (params: EsCreateIndexParams): Promise<string> => {
    const { elasticsearchClient, tenant, locale, type, isHeadlessCmsModel } = params;

    try {
        const index = esGetIndexName({ tenant, locale, type, isHeadlessCmsModel });
        const exist = await esGetIndexExist(params);

        if (exist) {
            return index;
        }

        // Get registered plugins
        const plugin = elasticsearchIndexPlugins()
            .filter(plugin => {
                if (!plugin.locales) {
                    return true;
                }

                return plugin.locales.includes(locale.toLowerCase());
            })
            .pop();

        await elasticsearchClient.indices.create({
            index,
            ...(plugin && { body: plugin.body })
        });
        return index;
    } catch (ex) {
        throw new WebinyError(
            ex.message || "Could not create Elasticsearch index.",
            ex.code || "CREATE_ELASTICSEARCH_INDEX_ERROR",
            {
                error: ex,
                locale,
                tenant,
                type
            }
        );
    }
};
