import useGqlHandler from "./useGqlHandler";
import apiKeyAuthentication from "../src/authentication/apiKey";
import apiKeyAuthorization from "../src/authorization/apiKey";

describe("Security Access Token Test", () => {
    const { install, securityApiKeys } = useGqlHandler();

    const adminData = { firstName: "John", lastName: "Doe", login: "admin@webiny.com" };

    beforeEach(async () => {
        await install.install({
            data: adminData
        });
    });

    test("should create, list, update and delete a token", async () => {
        // Create a token
        const [createResponse] = await securityApiKeys.create({
            data: { name: "Github Actions", description: "Github Actions Token", permissions: [] }
        });

        expect(createResponse).toEqual({
            data: {
                security: {
                    createApiKey: {
                        data: {
                            id: expect.any(String),
                            name: "Github Actions",
                            description: "Github Actions Token",
                            token: expect.any(String),
                            permissions: [],
                            createdOn: expect.any(String)
                        },
                        error: null
                    }
                }
            }
        });

        const { data: token } = createResponse.data.security.createApiKey;

        // List tokens
        const [listResponse] = await securityApiKeys.list();

        expect(listResponse).toEqual({
            data: {
                security: {
                    listApiKeys: {
                        data: [
                            {
                                id: token.id,
                                name: "Github Actions",
                                token: token.token,
                                description: "Github Actions Token",
                                permissions: []
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // Get token
        const [getResponse] = await securityApiKeys.get({ id: token.id });

        expect(getResponse).toEqual({
            data: {
                security: {
                    getApiKey: {
                        data: {
                            id: token.id,
                            name: "Github Actions",
                            token: token.token,
                            description: "Github Actions Token",
                            permissions: []
                        },
                        error: null
                    }
                }
            }
        });

        // Update token
        const [updateResponse] = await securityApiKeys.update({
            id: token.id,
            data: { name: "Renamed token", description: "Updated description", permissions: [] }
        });

        expect(updateResponse).toEqual({
            data: {
                security: {
                    updateApiKey: {
                        data: {
                            id: token.id,
                            name: "Renamed token",
                            description: "Updated description",
                            token: token.token,
                            permissions: []
                        },
                        error: null
                    }
                }
            }
        });

        // Delete token
        const [deleteResponse] = await securityApiKeys.delete({
            id: token.id
        });

        expect(deleteResponse).toEqual({
            data: {
                security: {
                    deleteApiKey: {
                        data: true,
                        error: null
                    }
                }
            }
        });
    });

    test("should authenticate using API key sent via headers", async () => {
        const { securityApiKeys, securityUser } = useGqlHandler({
            plugins: [apiKeyAuthentication(), apiKeyAuthorization()]
        });

        const [createResponse] = await securityApiKeys.create({
            data: {
                name: "API Key",
                description: "API key description",
                permissions: [{ name: "security.user" }]
            }
        });

        const { data: apiKey } = createResponse.data.security.createApiKey;

        expect(createResponse).toEqual({
            data: {
                security: {
                    createApiKey: {
                        data: {
                            id: expect.any(String),
                            name: "API Key",
                            description: "API key description",
                            permissions: [{ name: "security.user" }],
                            token: expect.stringMatching(/a[a-f0-9]{47}/),
                            createdOn: expect.stringMatching(/^20/)
                        },
                        error: null
                    }
                }
            }
        });

        // Should throw Not Authorized error
        const [listErrorResponse] = await securityUser.list({}, { Authorization: "123" });

        expect(listErrorResponse).toEqual({
            data: {
                security: {
                    listUsers: {
                        data: null,
                        error: {
                            message: "Not authorized!",
                            code: "SECURITY_NOT_AUTHORIZED",
                            data: null
                        }
                    }
                }
            }
        });

        // "listUsers" should return an array of users
        const [listResponse] = await securityUser.list({}, { Authorization: apiKey.token });

        expect(listResponse).toEqual({
            data: {
                security: {
                    listUsers: {
                        data: [
                            {
                                firstName: "John",
                                lastName: "Doe",
                                login: "admin@webiny.com",
                                avatar: null,
                                gravatar:
                                    "https://www.gravatar.com/avatar/c2f38b46a736d5c40769e909a4472cca",
                                group: {
                                    name: "Full Access",
                                    slug: "full-access"
                                }
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });
});
