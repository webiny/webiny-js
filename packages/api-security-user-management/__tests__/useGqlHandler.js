import { createHandler } from "@webiny/handler-aws";
import dynamoDb from "@webiny/api-plugin-commodo-dynamodb";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import securityPlugins from "@webiny/api-security/authenticator";
import userManagement from "@webiny/api-security-user-management";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

export default () => {
    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        dynamoDb({
            documentClient: new DocumentClient({
                convertEmptyValues: true,
                endpoint: "localhost:8000",
                sslEnabled: false,
                region: "local-env"
            })
        }),
        apolloServerPlugins(),
        securityPlugins(),
        { type: "security-authorization", getPermissions: () => [{ name: "*", key: "*" }] },
        // TODO: Add Cognito plugins for authentication
        // Add user management
        userManagement(),
        // Add Cognito plugins for user management
        [
            {
                name: "security-user-management",
                type: "security-user-management",
                async createUser({ data, user, permanent = false }) {
                    return Promise.resolve();
                },
                async updateUser({ data, user }) {
                    return Promise.resolve();
                },
                async deleteUser({ user }) {
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
        }
    };

    return {
        handler,
        invoke,
        securityGroup,
        securityUser
    };
};

const CREATE_SECURITY_GROUP = /* GraphQL */ `
    mutation CreateGroup($data: SecurityGroupInput!) {
        security {
            createGroup(data: $data) {
                data {
                    id
                    name
                    description
                    slug
                    permissions
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

const UPDATE_SECURITY_GROUP = /* GraphQL */ `
    mutation UpdateGroup($id: ID!, $data: SecurityGroupInput!) {
        security {
            updateGroup(id: $id, data: $data) {
                data {
                    id
                    name
                    description
                    slug
                    permissions
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

const DELETE_SECURITY_GROUP = /* GraphQL */ `
    mutation DeleteGroup($id: ID!) {
        security {
            deleteGroup(id: $id) {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

const LIST_SECURITY_GROUPS = /* GraphQL */ `
    query ListGroups($where: ListSecurityGroupWhereInput, $sort: Int) {
        security {
            listGroups(where: $where, sort: $sort) {
                data {
                    id
                    name
                    description
                    slug
                    permissions
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

const GET_SECURITY_GROUP = /* GraphQL */ `
    query GetGroup($id: ID, $slug: String) {
        security {
            getGroup(id: $id, slug: $slug) {
                data {
                    id
                    name
                    description
                    slug
                    permissions
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

const CREATE_SECURITY_USER = /* GraphQL */ `
    mutation CreateUser($data: SecurityUserInput!) {
        security {
            createUser(data: $data) {
                data {
                    id
                    email
                    firstName
                    lastName
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

const UPDATE_SECURITY_USER = /* GraphQL */ `
    mutation UpdateUser($id: ID!, $data: SecurityUserInput!) {
        security {
            updateUser(id: $id, data: $data) {
                data {
                    id
                    email
                    firstName
                    lastName
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

const DELETE_SECURITY_USER = /* GraphQL */ `
    mutation DeleteUser($id: ID!) {
        security {
            deleteUser(id: $id) {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

const LIST_SECURITY_USERS = /* GraphQL */ `
    query ListUser {
        security {
            listUsers {
                data {
                    id
                    email
                    firstName
                    lastName
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

const GET_SECURITY_USER = /* GraphQL */ `
    query GetUser($id: ID, $login: String) {
        security {
            getUser(id: $id, login: $login) {
                data {
                    id
                    email
                    firstName
                    lastName
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;
