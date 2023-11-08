import { createEventHandler, createHandler } from "@webiny/handler-aws/raw";
import graphqlHandler from "@webiny/handler-graphql";
import { createScheduler } from "~/scheduler";
import { ContextPlugin } from "@webiny/api";
import { PageBuilderContextObject, PbContext } from "@webiny/api-page-builder/graphql/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { createPermissions } from "../utils/helpers";
import { ApwContext } from "~/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { ApwScheduleActionStorageOperations } from "~/scheduler/types";

interface Params {
    plugins?: any;
}

export default (params: Params = {}) => {
    const { plugins: extraPlugins = [] } = params;

    const apwScheduleStorage = getStorageOps<ApwScheduleActionStorageOperations>("apwSchedule");

    const handler = createHandler<unknown, ApwContext>({
        plugins: [
            ...apwScheduleStorage.plugins,
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
                context.pageBuilder = {} as unknown as PageBuilderContextObject;
            }),
            new ContextPlugin<any>(async context => {
                context.scheduleAction = createScheduler({
                    storageOperations: apwScheduleStorage.storageOperations,
                    getTenant: () => {
                        return {
                            id: "root",
                            name: "Root",
                            parent: null,
                            status: "unknown",
                            description: "",
                            settings: {
                                domains: []
                            },
                            tags: [],
                            createdOn: new Date().toISOString(),
                            savedOn: new Date().toISOString()
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
                    getIdentity: (): SecurityIdentity => {
                        return {
                            id: "12345678",
                            type: "admin",
                            displayName: "John Doe",
                            permissions: createPermissions().concat({ name: "pb.*" })
                        };
                    }
                });
            }),
            createEventHandler(async ({ context }) => {
                return context;
            }),
            /**
             * We need an EventPlugin defined because it returns the context which we actually use in tests.
             */
            extraPlugins || []
        ]
    });

    return {
        handler
    };
};
