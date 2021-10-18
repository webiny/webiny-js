import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
import pageImportExportTaskPlugins from "../../src/graphql/crud/pageImportExportTasks.crud";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { PbContext } from "@webiny/api-page-builder/graphql/types";
import WebinyError from "@webiny/error";
import securityPlugins from "@webiny/api-security";
import { SecurityIdentity } from "@webiny/api-security/types";

const setup = () => {
    return new ContextPlugin<PbContext>(context => {
        if (context.pageBuilder) {
            throw new WebinyError("PbContext setup must be first loaded.", "CONTEXT_SETUP_ERROR");
        }
        context.pageBuilder = {} as any;
    });
};

interface Params {
    plugins?: any;
}

export default (params: Params = {}) => {
    const { plugins: extraPlugins = [] } = params;

    // @ts-ignore
    const { storageOperations } = __getStorageOperations();
    const handler = createHandler(
        // storageOperations(),
        securityPlugins(),
        graphqlHandler(),
        {
            type: "context",
            apply: context => {
                if (context.tenancy) {
                    return;
                }
                context.tenancy = {
                    getCurrentTenant: () => {
                        return {
                            id: "root"
                        };
                    }
                };
            }
        },
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
        {
            type: "security-authorization",
            name: "security-authorization",
            getPermissions: () => [{ name: "*" }]
        },
        {
            type: "security-authentication",
            authenticate: () =>
                new SecurityIdentity({
                    id: "mocked",
                    displayName: "m",
                    type: "a"
                })
        },
        setup(),
        pageImportExportTaskPlugins({ storageOperations }),
        extraPlugins || []
    );

    return {
        handler
    };
};
