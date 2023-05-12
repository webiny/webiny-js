import WebinyError from "@webiny/error";
import { Client } from "@elastic/elasticsearch";
import { FileManagerContextWithElasticsearch } from "~/types";
import { createElasticsearchIndex } from "~/elasticsearch/createElasticsearchIndex";
import { PluginsContainer } from "@webiny/plugins";

export const attachCreateIndexOnI18NCreate = (
    context: FileManagerContextWithElasticsearch,
    storagePlugins: PluginsContainer
) => {
    if (!context.i18n || !context.i18n.locales) {
        return;
    }
    context.i18n.locales.onLocaleBeforeCreate.subscribe(async ({ locale, tenant }) => {
        const client = context.elasticsearch as Client;
        if (!client) {
            throw new WebinyError(
                "Missing Elasticsearch client on the context.",
                "ELASTICSEARCH_CLIENT_ERROR",
                {
                    locale: locale.code,
                    tenant
                }
            );
        }

        await createElasticsearchIndex({
            locale: locale.code,
            tenant,
            plugins: storagePlugins,
            elasticsearch: client
        });
    });
};
