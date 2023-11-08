import { createWcpContext } from "@webiny/api-wcp";
import { createHandler } from "@webiny/handler-aws/raw";
import graphqlHandler from "@webiny/handler-graphql";
import { ContextPlugin } from "@webiny/api";
import { EventPlugin } from "@webiny/handler";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import importExportTaskPlugins from "~/graphql/crud/importExportTasks.crud";
import { createTenancyAndSecurity } from "../tenancySecurity";
import { PbImportExportContext } from "~/graphql/types";
import { ImportExportTaskStorageOperations } from "~/types";

interface Params {
    plugins?: any;
}

export default (params: Params = {}) => {
    const { plugins: extraPlugins = [] } = params;
    const pageBuilderImportExport =
        getStorageOps<ImportExportTaskStorageOperations>("pageBuilderImportExport");

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
                    /**
                     * No need to define all the methods for the dummy context.
                     */
                    // @ts-expect-error
                    context.i18n = {
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
                        checkI18NContentPermission: async () => {
                            return;
                        }
                    };
                }
            },
            new ContextPlugin<PbImportExportContext>(context => {
                context.pageBuilder = {} as PbImportExportContext["pageBuilder"];
            }),
            importExportTaskPlugins({
                storageOperations: pageBuilderImportExport.storageOperations
            }),
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
