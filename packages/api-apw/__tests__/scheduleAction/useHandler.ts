import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
import { createScheduler } from "~/scheduler";
import { ContextPlugin } from "@webiny/handler";
import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { SecurityPermission } from "@webiny/api-security/types";

interface Params {
    plugins?: any;
}

export default (params: Params = {}) => {
    const { plugins: extraPlugins = [] } = params;

    // @ts-ignore
    const { storageOperations } = __getStorageOperations();
    const handler = createHandler(
        ...createTenancyAndSecurity(),
        graphqlHandler(),
        {
            type: "context",
            apply: (context: any) => {
                if (context.i18n) {
                    return;
                }

                context.i18n = {
                    getContentLocale: () => {
                        return {
                            code: "en-US"
                        };
                    },
                    hasI18NContentPermission: () => {
                        return true;
                    },
                    checkI18NContentPermission: () => {
                        return;
                    }
                };
            }
        },
        new ContextPlugin<PbContext>(context => {
            context.pageBuilder = {} as any;
        }),
        new ContextPlugin<any>(async context => {
            context.scheduleAction = createScheduler({
                storageOperations,
                getTenant: () => {
                    return {
                        id: "root",
                        name: "Root",
                        parent: null,
                        status: "unknown",
                        description: "",
                        settings: {
                            domains: []
                        }
                    };
                },
                getLocale: () => {
                    return { code: "en-US", default: true };
                },
                getPermission: async (name: string) => {
                    if (!name) {
                        return null;
                    }
                    return [{ name: "*" }] as unknown as SecurityPermission;
                },
                getIdentity: () => {
                    return {
                        id: "12345678",
                        type: "admin",
                        displayName: "John Doe"
                    };
                }
            });
        }),
        extraPlugins || []
    );

    return {
        handler
    };
};
