import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import { Client } from "@elastic/elasticsearch";
import { FileManagerContext } from "~/types";
import { createElasticsearchIndex } from "~/elasticsearch/createElasticsearchIndex";

export const attachCreateIndexOnI18NCreate = (): ContextPlugin<FileManagerContext> => {
    return new ContextPlugin(async context => {
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
                plugins: context.plugins,
                elasticsearch: client
            });
        });
    });
};
