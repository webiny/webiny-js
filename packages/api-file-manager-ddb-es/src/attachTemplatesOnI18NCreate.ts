import { ContextPlugin } from "@webiny/handler";
import { FileElasticsearchIndexTemplatePlugin } from "~/plugins/FileElasticsearchIndexTemplatePlugin";
import { Client } from "@elastic/elasticsearch";
import WebinyError from "@webiny/error";
import { FileManagerContext } from "~/types";

export const attachTemplatesOnI18NCreate = (): ContextPlugin<FileManagerContext> => {
    return new ContextPlugin(async context => {
        if (!context.i18n || !context.i18n.locales) {
            return;
        }
        context.i18n.locales.onBeforeCreate.subscribe(async ({ locale }) => {
            const client = context.elasticsearch as Client;
            if (!client) {
                throw new WebinyError(
                    "Missing Elasticsearch client on the context.",
                    "ELASTICSEARCH_CLIENT_ERROR",
                    {
                        locale
                    }
                );
            }
            const templates = context.plugins
                .byType<FileElasticsearchIndexTemplatePlugin>(
                    FileElasticsearchIndexTemplatePlugin.type
                )
                .filter(plugin => {
                    return plugin.canUse(locale.code);
                });
            /**
             * We always insert all the templates we found, even default one because it might have changed.
             */
            for (const tpl of templates) {
                try {
                    await client.indices.putTemplate(tpl.template);
                } catch (ex) {
                    throw new WebinyError(
                        "Missing Elasticsearch client on the context.",
                        "ELASTICSEARCH_CLIENT_ERROR",
                        {
                            locale,
                            error: ex,
                            template: tpl
                        }
                    );
                }
            }
        });
    });
};
