import { createHandler } from "@webiny/handler-aws";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import pageBuilderPlugins from "@webiny/api-page-builder/plugins";
import securityPlugins from "@webiny/api-security/authenticator";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

export default () => {
    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        dbPlugins({
            table: "PageBuilder",
            driver: new DynamoDbDriver({
                documentClient: new DocumentClient({
                    convertEmptyValues: true,
                    endpoint: "localhost:8000",
                    sslEnabled: false,
                    region: "local-env"
                })
            })
        }),
        apolloServerPlugins(),
        securityPlugins(),
        { type: "security-authorization", getPermissions: () => [{ name: "*", key: "*" }] },
        pageBuilderPlugins()
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
        async createMenu(variables) {
            return invoke({ body: { query: CREATE_MENU, variables } });
        },
        async updateMenu(variables) {
            return invoke({ body: { query: UPDATE_MENU, variables } });
        },
        async deleteMenu(variables) {
            return invoke({ body: { query: DELETE_MENU, variables } });
        },
        async listMenus(variables) {
            return invoke({ body: { query: LIST_MENUS, variables } });
        },
        async getMenu(variables) {
            return invoke({ body: { query: GET_MENU, variables } });
        }
    };
};

const DATA_FIELD = /* GraphQL */ `
    {
        slug
        description
        title
        items
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

const CREATE_MENU = /* GraphQL */ `
    mutation CreateMenu($data: PbMenuInput!) {
        pageBuilder {
            createMenu(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

const UPDATE_MENU = /* GraphQL */ `
    mutation UpdateMenu($slug: String!, $data: PbMenuInput!) {
        pageBuilder {
            updateMenu(slug: $slug, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

const LIST_MENUS = /* GraphQL */ `
    query ListMenus {
        pageBuilder {
            listMenus {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

const GET_MENU = /* GraphQL */ `
    query GetMenu($slug: String!) {
        pageBuilder {
            getMenu(slug: $slug) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

const DELETE_MENU = /* GraphQL */ `
    mutation DeleteMenu($slug: String!) {
        pageBuilder {
            deleteMenu(slug: $slug) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
