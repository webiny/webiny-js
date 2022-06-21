import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
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

type UseGqlHandlerParams = {
    plugins?: any;
};

export default (params: UseGqlHandlerParams = {}) => {
    const { plugins: extraPlugins } = params;

    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        createWcpContext(),
        createWcpGraphQL(),
        ...createTenancyAndSecurity(),
        graphqlHandler(),
        tenantManagerPlugins(),
        extraPlugins || []
    );

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }) => {
        const response = await handler({
            httpMethod,
            headers,
            body: JSON.stringify(body),
            ...rest
        });

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
        async createTenant(variables) {
            return invoke({ body: { query: CREATE_TENANT, variables } });
        },
        async updateTenant(variables) {
            return invoke({ body: { query: UPDATE_TENANT, variables } });
        },
        async deleteTenant(variables) {
            return invoke({ body: { query: DELETE_TENANT, variables } });
        },
        async listTenants(variables = {}) {
            return invoke({ body: { query: LIST_TENANTS, variables } });
        },
        async getTenant(variables) {
            return invoke({ body: { query: GET_TENANT, variables } });
        }
    };
};
