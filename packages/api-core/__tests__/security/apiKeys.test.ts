import { describe, test, expect, vi, beforeEach } from "vitest";
import { mockCreateGetWcpProjectEnvironment } from "./aacl/mocks/mockCreateGetWcpProjectEnvironment.js";
import { mockCreateGetWcpProjectLicense } from "./aacl/mocks/mockCreateGetWcpProjectLicense.js";
import { useGqlHandler } from "../useGqlHandler.js";
import apiKeyAuthentication from "~/legacy/security/plugins/apiKeyAuthentication.js";
import apiKeyAuthorization from "~/legacy/security/plugins/apiKeyAuthorization.js";

vi.mock("~/features/wcp/WcpContext/utils.js", async () => {
    // The mock returned only mocks the generateServerSeed method.
    const actual = await vi.importActual("~/features/wcp/WcpContext/utils.js");

    return {
        ...actual,
        wcpFetch: () => ({ error: false })
    };
});

vi.mock("@webiny/wcp", async () => {
    // The mock returned only mocks the generateServerSeed method.
    const actual = await vi.importActual("@webiny/wcp");

    return {
        ...actual,
        getWcpProjectEnvironment: mockCreateGetWcpProjectEnvironment(),
        getWcpProjectLicense: mockCreateGetWcpProjectLicense(license => {
            license.package.features.advancedAccessControlLayer.enabled = true;
        })
    };
});

describe("Security API Key Test", () => {
    const { install, securityApiKeys } = useGqlHandler();

    beforeEach(async () => {
        await install.install();
    });

    test("should create, list, update and delete an API key", async () => {
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

        // List again to make sure that an updated token is accessible.
        const [listResponse2] = await securityApiKeys.list();

        expect(listResponse2).toEqual({
            data: {
                security: {
                    listApiKeys: {
                        data: [
                            {
                                id: token.id,
                                name: "Renamed token",
                                token: token.token,
                                description: "Updated description",
                                permissions: []
                            }
                        ],
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
        const { securityApiKeys } = useGqlHandler();

        const { securityRole } = useGqlHandler({
            plugins: [
                apiKeyAuthentication({ identityType: "apiKey" }),
                apiKeyAuthorization({ identityType: "apiKey" })
            ]
        });

        const [createResponse] = await securityApiKeys.create({
            data: {
                name: "API Key",
                description: "API key description",
                permissions: [{ name: "security.role" }]
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
                            permissions: [{ name: "security.role" }],
                            token: expect.stringMatching(/a[a-f0-9]{47}/),
                            createdOn: expect.stringMatching(/^20/)
                        },
                        error: null
                    }
                }
            }
        });

        // Should throw Not Authorized error
        const [listErrorResponse] = await securityRole.list({}, { Authorization: "123" });

        expect(listErrorResponse).toEqual({
            data: {
                security: {
                    listRoles: {
                        data: null,
                        error: {
                            message: "Not authorized!",
                            code: "NOT_AUTHORIZED",
                            data: {}
                        }
                    }
                }
            }
        });

        // "listRoles" should return an array of users
        const [listResponse] = await securityRole.list({}, { Authorization: apiKey.token });

        // Expect 1 role: ful-access
        expect(listResponse.data.security.listRoles.data.length).toEqual(1);
        expect(listResponse.data.security.listRoles.data[0].slug).toBe("full-access");
    });
});
