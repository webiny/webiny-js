import { Client } from "@elastic/elasticsearch";
import { createIndex } from "@webiny/api-elasticsearch";
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
    const { elasticsearch, plugins, locale, tenant } = params;

    const { index } = configurations.es({
        locale,
        tenant
    });
    await createIndex({
        plugins,
        client: elasticsearch,
        type: PageElasticsearchIndexPlugin.type,
        index,
        tenant,
        locale,
        onExists: () => {
            console.log(
                `Elasticsearch index "${index}" for the Page Builder Pages already exists.`
            );
        },
        onError: (ex: Error) => {
            console.error(
                `Could not create the Page Builder Pages Elasticsearch index "${index}".`,
                ex
            );
            return ex;
        }
    });
};
