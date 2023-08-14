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

    const index = esGetIndexName({ tenant, locale, type, isHeadlessCmsModel });

    try {
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
        // Despite the fact the above `esGetIndexExist` check told us the index does not exist,
        // we've seen cases where the `resource_already_exists_exception` would still be thrown
        // by Elasticsearch, hence the check below.
        if (ex.message === "resource_already_exists_exception") {
            return index;
        }

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
