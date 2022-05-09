import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
import pageImportExportTaskPlugins from "~/graphql/crud/pageImportExportTasks.crud";
import { ContextPlugin } from "@webiny/handler";
import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { createTenancyAndSecurity } from "../tenancySecurity";

interface Params {
    plugins?: any;
}

export default (params: Params = {}) => {
    const { plugins: extraPlugins = [] } = params;

    // @ts-ignore
    const { storageOperations } = __getStorageOperations();
    const handler = createHandler(
        // storageOperations(),
        ...createTenancyAndSecurity(),
        graphqlHandler(),
        {
            type: "context",
            apply: (context: PbContext) => {
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
        new ContextPlugin<PbContext>(context => {
            context.pageBuilder = {} as any;
        }),
        pageImportExportTaskPlugins({ storageOperations }),
        extraPlugins || []
    );

    return {
        handler
    };
};
