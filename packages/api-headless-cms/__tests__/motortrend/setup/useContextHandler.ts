import { createWcpContext } from "@webiny/api-wcp";
import i18nContext from "@webiny/api-i18n/graphql/context";
import { createHandler, createEventHandler } from "@webiny/handler-aws/raw";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { ApiKey } from "@webiny/api-security/types";
import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import { createDummyLocales } from "../../testHelpers/helpers";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { createTenancyAndSecurity } from "../../testHelpers/tenancySecurity";
import { getStorageOperations } from "../../testHelpers/storageOperations";
import { CmsContext } from "~/types";
import { ContextPlugin } from "@webiny/api";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "~/index";
import { createMotorTrendCmsModel } from "./model";

export const useGraphQLHandler = () => {
    const ops = getStorageOperations({});

    const tenant = {
        id: "root",
        name: "Root",
        parent: null
    };
    const locale = "en-US";

    const app = createHeadlessCmsContext({
        storageOperations: ops.storageOperations
    });

    const handlerPlugins = [
        createWcpContext(),
        ...ops.plugins,
        ...createTenancyAndSecurity({
            setupGraphQL: false,
            permissions: [
                {
                    name: "*"
                }
            ]
        }),
        {
            type: "context",
            name: "context-security-tenant",
            async apply(context) {
                context.security.getApiKeyByToken = async (
                    token: string
                ): Promise<ApiKey | null> => {
                    if (!token || token !== "aToken") {
                        return null;
                    }
                    const apiKey = "a1234567890";
                    return {
                        id: apiKey,
                        name: apiKey,
                        tenant: tenant.id,
                        // @ts-ignore
                        permissions: identity?.permissions || [],
                        token,
                        createdBy: {
                            id: "test",
                            displayName: "test",
                            type: "admin"
                        },
                        description: "test",
                        createdOn: new Date().toISOString(),
                        webinyVersion: context.WEBINY_VERSION
                    };
                };
            }
        } as ContextPlugin<CmsContext>,
        apiKeyAuthentication({ identityType: "api-key" }),
        apiKeyAuthorization({ identityType: "api-key" }),
        i18nContext(),
        i18nDynamoDbStorageOperations(),
        createDummyLocales(),
        mockLocalesPlugins(),
        createMotorTrendCmsModel(),
        createHeadlessCmsGraphQL(),
        ...app,
        createEventHandler(async ({ context }) => {
            return context;
        })
    ];

    const handler = createHandler<any, CmsContext>({
        plugins: handlerPlugins,
        http: {
            debug: true
        }
    });

    return {
        handle: async () => {
            return handler(
                {
                    headers: {
                        ["Content-Type"]: "application/json",
                        ["x-tenant"]: tenant.id,
                        ["x-webiny-cms-endpoint"]: "manage",
                        ["x-webiny-cms-locale"]: locale
                    }
                },
                {} as any
            );
        },
        tenant,
        locale,
        storageOperations: ops.storageOperations
    };
};
