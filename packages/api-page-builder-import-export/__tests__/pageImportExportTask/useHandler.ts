import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
import pageImportExportTaskPlugins from "~/graphql/crud/pageImportExportTasks.crud";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
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
            apply: context => {
                if (context.i18nContent) {
                    return;
                }
                context.i18nContent = {
                    getLocale: () => {
                        return {
                            code: "en-US"
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
