import { createHandler } from "@webiny/handler-aws";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import securityPlugins from "@webiny/api-security/authenticator";
import tenancyPlugins from "../src/plugins";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

export default () => {
    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        dbPlugins({
            table: "Tenants",
            driver: new DynamoDbDriver({
                documentClient: new DocumentClient({
                    convertEmptyValues: true,
                    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
                    sslEnabled: false,
                    region: "local"
                })
            })
        }),
        apolloServerPlugins(),
        securityPlugins(),
        { type: "security-authorization", getPermissions: () => [{ name: "*" }] },
        tenancyPlugins()
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
        async getTenantById(variables, headers = {}) {
            return invoke({ body: { query: GET_TENANT_BY_ID, variables }, headers });
        },
        async listTenants(variables, headers = {}) {
            return invoke({ body: { query: LIST_TENANTS, variables }, headers });
        },
        async createTenant(variables, headers = {}) {
            return invoke({ body: { query: CREATE_TENANT, variables }, headers });
        }
    };
};

const GET_TENANT_BY_ID = /* GraphQL */ `
    query GetTenantByID($id: ID!) {
        tenants {
            getTenant(id: $id) {
                data {
                    id
                    name
                    parent
                }
            }
        }
    }
`;

const LIST_TENANTS = /* GraphQL */ `
    query ListTenants {
        tenants {
            listTenants {
                data {
                    id
                    name
                    parent
                }
            }
        }
    }
`;

const CREATE_TENANT = /* GraphQL */ `
    mutation CreateTenant($data: TenantInput!) {
        tenants {
            createTenant(data: $data) {
                data {
                    id
                    name
                    parent
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;
