import WebinyError from "@webiny/error";
import { Client } from "@elastic/elasticsearch";
import { getLastAddedIndexPlugin } from "@webiny/api-elasticsearch/indices";
import { PluginsContainer } from "@webiny/plugins";
import { PageElasticsearchIndexPlugin } from "~/plugins/definitions/PageElasticsearchIndexPlugin";
import { configurations } from "~/configurations";

export interface ExecOnBeforeInstallParams {
    elasticsearch: Client;
    plugins: PluginsContainer;
    tenant: string;
    locale: string;
}
export const createElasticsearchIndex = async (
    params: ExecOnBeforeInstallParams
): Promise<void> => {
    const { elasticsearch, plugins: container, locale, tenant } = params;

    const plugin = getLastAddedIndexPlugin<PageElasticsearchIndexPlugin>({
        container,
        type: PageElasticsearchIndexPlugin.type,
        locale
    });

    const { index } = configurations.es({
        locale,
        tenant
    });

    try {
        const response = await elasticsearch.indices.exists({
            index
        });
        if (response.body) {
            return;
        }
        await elasticsearch.indices.create({
            index,
            body: plugin.body
        });
    } catch (ex) {
        throw new WebinyError(
            ex.message ||
                "Could not create Elasticsearch index template for the Page Builder Pages.",
            ex.code || "PB_ELASTICSEARCH_TEMPLATE_ERROR",
            {
                error: ex,
                locale,
                body: plugin.body
            }
        );
    }
};
