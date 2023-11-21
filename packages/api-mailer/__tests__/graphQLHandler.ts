import { getIntrospectionQuery } from "graphql";
import { createHandler } from "@webiny/handler-aws";
import { ApiKey, SecurityIdentity } from "@webiny/api-security/types";
import { sleep, until } from "./context/helpers";
/**
 * Unfortunately at we need to import the api-i18n-ddb package manually
 */
import { ContextPlugin } from "@webiny/api";
import { MailerContext } from "~/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { GET_SETTINGS_QUERY, SAVE_SETTINGS_MUTATION } from "./graphql/settings";
import { CreateHandlerParams, createHandlerPlugins } from "./handlerPlugins";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";

interface ContextTenantParams {
    tenant: Pick<Tenant, "id" | "name" | "parent">;
    identity?: SecurityIdentity;
}
export const contextSecurity = ({
    tenant,
    identity
}: ContextTenantParams): ContextPlugin<MailerContext>[] => {
    return [
        new ContextPlugin<MailerContext>(async context => {
            context.security.getApiKeyByToken = async (token: string): Promise<ApiKey | null> => {
                if (!token || token !== "aToken") {
                    return null;
                }
                const apiKey = "a1234567890";
                return {
                    id: apiKey,
                    name: apiKey,
                    tenant: tenant.id,
                    permissions: identity?.["permissions"] || [],
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
        })
    ];
};

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export const createGraphQLHandler = (params?: CreateHandlerParams) => {
    const handler = createHandler({
        plugins: [createHandlerPlugins(params)],
        debug: false
    });

    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }: InvokeParams) => {
        const response = await handler(
            {
                path: "/graphql",
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            } as unknown as APIGatewayEvent,
            {} as LambdaContext
        );
        if (httpMethod === "OPTIONS" && !response.body) {
            return [null, response];
        }
        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    return {
        until,
        sleep,
        handler,
        invoke,
        async introspect() {
            return invoke({ body: { query: getIntrospectionQuery() } });
        },
        async getSettings() {
            return invoke({ body: { query: GET_SETTINGS_QUERY } });
        },
        async saveSettings(variables: Record<string, any>) {
            return invoke({ body: { query: SAVE_SETTINGS_MUTATION, variables } });
        }
    };
};
