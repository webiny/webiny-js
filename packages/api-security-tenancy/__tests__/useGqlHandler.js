import KSUID from "ksuid";
import { createHandler } from "@webiny/handler-aws";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import securityPlugins from "@webiny/api-security/authenticator";
import userManagement from "@webiny/api-security-user-management";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { SecurityIdentity } from "@webiny/api-security";
// Graphql
import mocks from "./mocks/securityUser";
import {
    UPDATE_SECURITY_GROUP,
    CREATE_SECURITY_GROUP,
    DELETE_SECURITY_GROUP,
    GET_SECURITY_GROUP,
    LIST_SECURITY_GROUPS
} from "./graphql/groups";
import {
    GET_CURRENT_SECURITY_USER,
    UPDATE_CURRENT_SECURITY_USER,
    DELETE_SECURITY_USER,
    UPDATE_SECURITY_USER,
    CREATE_SECURITY_USER,
    LIST_SECURITY_USERS,
    GET_SECURITY_USER,
    LOGIN
} from "./graphql/users";
import { INSTALL, IS_INSTALLED } from "./graphql/install";

export default () => {
    const documentClient = new DocumentClient({
        convertEmptyValues: true,
        endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
        sslEnabled: false,
        region: "local"
    });
    
    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        dbPlugins({
            table: "Security",
            driver: new DynamoDbDriver({
                documentClient
            })
        }),
        apolloServerPlugins(),
        securityPlugins(),
        {
            type: "security-authorization",
            getPermissions: () => [
                { name: "security.user.manage" },
                { name: "security.group.manage" }
            ]
        },
        // Add Cognito plugins for authentication
        {
            type: "security-authentication",
            async authenticate() {
                return new SecurityIdentity(mocks.admin);
            }
        },
        // Add user management
        userManagement(),
        // Add Cognito plugins for user management
        [
            {
                name: "security-user-management",
                type: "security-user-management",
                async createUser({ user }) {
                    user.id = KSUID.randomSync().string;
                    return Promise.resolve();
                },
                async updateUser() {
                    return Promise.resolve();
                },
                async deleteUser() {
                    return Promise.resolve();
                }
            }
        ]
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

    const securityGroup = {
        async create(variables) {
            return invoke({ body: { query: CREATE_SECURITY_GROUP, variables } });
        },
        async update(variables) {
            return invoke({ body: { query: UPDATE_SECURITY_GROUP, variables } });
        },
        async delete(variables) {
            return invoke({ body: { query: DELETE_SECURITY_GROUP, variables } });
        },
        async list(variables) {
            return invoke({ body: { query: LIST_SECURITY_GROUPS, variables } });
        },
        async get(variables) {
            return invoke({ body: { query: GET_SECURITY_GROUP, variables } });
        }
    };

    const securityUser = {
        async login() {
            return invoke({ body: { query: LOGIN } });
        },
        async create(variables) {
            return invoke({ body: { query: CREATE_SECURITY_USER, variables } });
        },
        async update(variables) {
            return invoke({ body: { query: UPDATE_SECURITY_USER, variables } });
        },
        async delete(variables) {
            return invoke({ body: { query: DELETE_SECURITY_USER, variables } });
        },
        async list(variables) {
            return invoke({ body: { query: LIST_SECURITY_USERS, variables } });
        },
        async get(variables) {
            return invoke({ body: { query: GET_SECURITY_USER, variables } });
        },
        async getCurrentUser() {
            return invoke({ body: { query: GET_CURRENT_SECURITY_USER } });
        },
        async updateCurrentUser(variables) {
            return invoke({ body: { query: UPDATE_CURRENT_SECURITY_USER, variables } });
        }
    };

    const install = {
        async isInstalled() {
            return invoke({ body: { query: IS_INSTALLED } });
        },
        async install(variables) {
            return invoke({ body: { query: INSTALL, variables } });
        }
    };

    return {
        handler,
        invoke,
        securityGroup,
        securityUser,
        install,
        documentClient
    };
};
