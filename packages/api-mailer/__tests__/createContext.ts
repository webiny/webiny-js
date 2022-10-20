import { MailerContext } from "~/types";
import { createMailer } from "~/index";
import { Context, ContextPlugin } from "@webiny/api";
import { CmsModelPlugin } from "@webiny/api-headless-cms";
const { version } = require("@webiny/api-headless-cms/package.json");

export const createCms = () => {
    return new ContextPlugin<MailerContext>(async context => {
        const tenant = context.tenancy.getCurrentTenant().id;
        context.cms = {
            ...context.cms,
            getModel: async modelId => {
                const modelPlugin = context.plugins
                    .byType<CmsModelPlugin>(CmsModelPlugin.type)
                    .find(pl => {
                        return pl.contentModel.modelId === modelId;
                    });

                if (!modelPlugin) {
                    throw new Error(`Model "${modelId}" does not exist!`);
                }
                return {
                    ...modelPlugin.contentModel,
                    tenant,
                    locale: "en-US",
                    webinyVersion: version
                };
            }
        };
    });
};

const createTenancy = () => {
    return new ContextPlugin<MailerContext>(async context => {
        context.tenancy = {
            ...context.tenancy,
            getCurrentTenant: (): any => {
                return {
                    name: "root",
                    description: "root",
                    id: "root",
                    createdOn: new Date().toISOString(),
                    savedOn: new Date().toISOString(),
                    status: "active",
                    settings: {
                        domains: []
                    },
                    parent: null
                };
            }
        };
    });
};

export const createContext = async (): Promise<MailerContext> => {
    const context = new Context({
        WEBINY_VERSION: process.env.WEBINY_VERSION || "unknown",
        plugins: [createTenancy(), createCms(), ...createMailer()]
    }) as unknown as MailerContext;

    for (const plugin of context.plugins.byType<ContextPlugin>(ContextPlugin.type)) {
        await plugin.apply(context);
    }

    return context;
};
