import { createHandler } from "@webiny/handler-aws";
import apolloServerPlugins from "@webiny/handler-graphql";
import securityPlugins from "@webiny/api-security/authenticator";
import { SecurityIdentity } from "@webiny/api-security";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import tenancyPlugins from "../src/index";
// Graphql
import {
    UPDATE_SECURITY_GROUP,
    CREATE_SECURITY_GROUP,
    DELETE_SECURITY_GROUP,
    GET_SECURITY_GROUP,
    LIST_SECURITY_GROUPS
} from "./graphql/groups";
import {
    UPDATE_CURRENT_SECURITY_USER,
    DELETE_SECURITY_USER,
    UPDATE_SECURITY_USER,
    CREATE_SECURITY_USER,
    LIST_SECURITY_USERS,
    GET_SECURITY_USER,
    LOGIN
} from "./graphql/users";
import { INSTALL, IS_INSTALLED } from "./graphql/install";

export default (opts = {}) => {
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
        tenancyPlugins(),
        {
            type: "security-authorization",
            getPermissions: async context => {
                if (opts.fullAccess) {
                    return [{ name: "*" }];
                }
                
                const tenant = context.security.getTenant();
                const allPermissions = await context.security.users.getUserAccess(
                    context.security.getIdentity().id
                );
                const tenantAccess = allPermissions.find(p => p.tenant.id === tenant.id);
                return tenantAccess ? tenantAccess.group.permissions : null;
            }
        },
        {
            type: "security-authentication",
            async authenticate() {
                return new SecurityIdentity({
                    id: "admin@webiny.com",
                    type: "admin",
                    displayName: "John Doe",
                    firstName: "John",
                    lastName: "Doe"
                });
            }
        },
        // Add Cognito plugins for user management
        {
            name: "security-identity-provider",
            type: "security-identity-provider",
            async createUser() {
                return Promise.resolve();
            },
            async updateUser() {
                return Promise.resolve();
            },
            async deleteUser() {
                return Promise.resolve();
            }
        }
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
