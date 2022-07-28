import { createWcpContext } from "@webiny/api-wcp";
import { createHandler, EventPlugin } from "@webiny/handler-fastify";
import graphqlHandler from "@webiny/handler-graphql";
import pageImportExportTaskPlugins from "~/graphql/crud/pageImportExportTasks.crud";
import { ContextPlugin } from "@webiny/handler";
import { createTenancyAndSecurity } from "../tenancySecurity";
import { PbPageImportExportContext } from "~/graphql/types";

interface Params {
    plugins?: any;
}

export default (params: Params = {}) => {
    const { plugins: extraPlugins = [] } = params;

    // @ts-ignore
    const { storageOperations } = __getStorageOperations();
    const handler = createHandler<PbPageImportExportContext>({
        plugins: [
            createWcpContext(),
            ...createTenancyAndSecurity(),
            graphqlHandler(),
            {
                type: "context",
                apply: (context: PbPageImportExportContext) => {
                    if (context.i18n) {
                        return;
                    }

                    context.i18n = {
                        // @ts-ignore
                        ...(context.i18n || ({} as any)),
                        getContentLocale() {
                            return { code: "en-US", default: true };
                        },
                        getCurrentLocale: () => {
                            return {
                                code: "en-US",
                                default: true,
                                createdBy: {
                                    id: "admin",
                                    type: "admin",
                                    displayName: "admin"
                                },
                                createdOn: new Date().toISOString(),
                                tenant: "root",
                                webinyVersion: process.env.WEBINY_VERSION
                            };
                        },
                        checkI18NContentPermission: () => {
                            return true;
                        }
                    };
                }
            },
            new ContextPlugin<PbPageImportExportContext>(context => {
                context.pageBuilder = {} as any;
            }),
            pageImportExportTaskPlugins({ storageOperations }),
            /**
             * We need an EventPlugin defined because it returns the context which we actually use in tests.
             */
            new EventPlugin<any, PbPageImportExportContext, PbPageImportExportContext>(
                async (_, ctx) => {
                    return ctx;
                }
            ),
            extraPlugins || []
        ]
    });

    return {
        handler
    };
};
