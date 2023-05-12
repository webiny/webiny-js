import { createWcpContext } from "@webiny/api-wcp";
import { createHandler } from "@webiny/handler-aws/raw";
import graphqlHandler from "@webiny/handler-graphql";
import importExportTaskPlugins from "~/graphql/crud/importExportTasks.crud";
import { ContextPlugin } from "@webiny/api";
import { createTenancyAndSecurity } from "../tenancySecurity";
import { PbImportExportContext } from "~/graphql/types";
import { EventPlugin } from "@webiny/handler";

interface Params {
    plugins?: any;
}

export default (params: Params = {}) => {
    const { plugins: extraPlugins = [] } = params;

    // @ts-ignore
    const { storageOperations } = __getStorageOperations();
    const handler = createHandler<any, PbImportExportContext>({
        plugins: [
            createWcpContext(),
            ...createTenancyAndSecurity(),
            graphqlHandler(),
            {
                type: "context",
                apply: (context: PbImportExportContext) => {
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
            new ContextPlugin<PbImportExportContext>(context => {
                context.pageBuilder = {} as any;
            }),
            importExportTaskPlugins({ storageOperations }),
            /**
             * We need an EventPlugin defined because it returns the context which we actually use in tests.
             */
            new EventPlugin(async ({ context }) => {
                return context;
            }),
            extraPlugins || []
        ]
    });

    return {
        handler
    };
};
