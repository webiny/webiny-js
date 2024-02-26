import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
import { SecurityIdentity } from "@webiny/api-security/types";
import tenantManagerPlugins from "../src";
import {
    CREATE_TENANT,
    DELETE_TENANT,
    GET_TENANT,
    LIST_TENANTS,
    UPDATE_TENANT,
    INSTALL_TENANCY,
    INSTALL_SECURITY
} from "./graphql/tenants";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";

type UseGqlHandlerParams = {
    plugins?: any;
    identity?: SecurityIdentity | null;
};

export default (params: UseGqlHandlerParams = {}) => {
    const { plugins: extraPlugins, identity } = params;

    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler({
        plugins: [
            createWcpContext(),
            createWcpGraphQL(),
            ...createTenancyAndSecurity({ identity }),
            graphqlHandler(),
            tenantManagerPlugins(),
            extraPlugins || []
        ]
    });

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body = {}, headers = {}, ...rest }) => {
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

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    return {
        handler,
        invoke,
        async install() {
            await invoke({ body: { query: INSTALL_TENANCY } });
            await invoke({ body: { query: INSTALL_SECURITY } });
        },
        async createTenant(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_TENANT, variables } });
        },
        async updateTenant(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_TENANT, variables } });
        },
        async deleteTenant(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_TENANT, variables } });
        },
        async listTenants(variables: Record<string, any> = {}) {
            return invoke({ body: { query: LIST_TENANTS, variables } });
        },
        async getTenant(variables: Record<string, any>) {
            return invoke({ body: { query: GET_TENANT, variables } });
        }
    };
};
