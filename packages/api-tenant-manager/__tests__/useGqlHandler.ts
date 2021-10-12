import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
import tenantManagerPlugins from "../src";
import tenancyPlugins from "@webiny/api-tenancy";
import securityPlugins from "@webiny/api-security";
const { DocumentClient } = require("aws-sdk/clients/dynamodb");
import { createStorageOperations as tenancyStorageOperations } from "@webiny/api-tenancy-so-ddb";
import { createStorageOperations as securityStorageOperations } from "@webiny/api-security-so-ddb";
import { customAuthenticator } from "./mocks/customAuthenticator";
import { customAuthorizer } from "./mocks/customAuthorizer";
import {
    CREATE_TENANT,
    DELETE_TENANT,
    GET_TENANT,
    LIST_TENANTS,
    UPDATE_TENANT,
    INSTALL_TENANCY,
    INSTALL_SECURITY
} from "./graphql/tenants";

type UseGqlHandlerParams = {
    plugins?: any;
};

// IMPORTANT: This must be removed from here in favor of a dynamic SO setup.
const documentClient = new DocumentClient({
    convertEmptyValues: true,
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
    sslEnabled: false,
    region: "local",
    accessKeyId: "test",
    secretAccessKey: "test"
});

export default (params: UseGqlHandlerParams = {}) => {
    const { plugins: extraPlugins } = params;

    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        tenancyPlugins({
            storageOperations: tenancyStorageOperations({ documentClient, table: "DynamoDB" })
        }),
        securityPlugins({
            storageOperations: securityStorageOperations({ documentClient, table: "DynamoDB" })
        }),
        customAuthenticator(),
        customAuthorizer(),
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
