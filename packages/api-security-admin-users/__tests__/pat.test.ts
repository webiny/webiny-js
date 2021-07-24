import useGqlHandler from "./useGqlHandler";
import patAuthentication from "../src/authentication/personalAccessToken";

describe("Security Personal Access Token Test", () => {
    const { install, securityUserPAT } = useGqlHandler();

    const adminData = { firstName: "John", lastName: "Doe", login: "admin@webiny.com" };

    beforeEach(async () => {
        await install.install({
            data: adminData
        });
    });

    test("should create, list, update and delete a PAT", async () => {
        // Create a token
        const [createResponse] = await securityUserPAT.createPAT({
            data: { name: "Github Actions" }
        });

        const createData = createResponse.data.security.createPAT.data;

        expect(createResponse).toEqual({
            data: {
                security: {
                    createPAT: {
                        data: {
                            pat: {
                                id: expect.any(String),
                                name: "Github Actions",
                                token: expect.any(String),
                                createdOn: expect.any(String)
                            },
                            token: expect.stringMatching(/p[a-f0-9]{47}/)
                        },
                        error: null
                    }
                }
            }
        });

        expect(createData.pat.token.length).toBe(4);
        expect(createData.token.length).toBe(48);

        const token = createData.pat;

        // Get own tokens
        const [getOwnTokensResponse] = await securityUserPAT.getCurrentUser();

        expect(getOwnTokensResponse).toEqual({
            data: {
                security: {
                    getCurrentUser: {
                        data: {
                            login: adminData.login,
                            personalAccessTokens: [token]
                        },
                        error: null
                    }
                }
            }
        });
        // Update token
        const [updateResponse] = await securityUserPAT.updatePAT({
            id: token.id,
            data: { name: "Renamed token" }
        });

        // data = updateResponse.data.security.updatePAT.data;
        expect(updateResponse).toEqual({
            data: {
                security: {
                    updatePAT: {
                        data: {
                            id: expect.any(String),
                            name: "Renamed token",
                            token: expect.any(String),
                            createdOn: expect.any(String)
                        },
                        error: null
                    }
                }
            }
        });

        // Delete token
        const [deleteResponse] = await securityUserPAT.deletePAT({
            id: token.id
        });

        expect(deleteResponse).toEqual({
            data: {
                security: {
                    deletePAT: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Make sure the token is deleted
        const [getOwnTokensCheckResponse] = await securityUserPAT.getCurrentUser();
        expect(getOwnTokensCheckResponse).toEqual({
            data: {
                security: {
                    getCurrentUser: {
                        data: {
                            login: "admin@webiny.com",
                            personalAccessTokens: []
                        },
                        error: null
                    }
                }
            }
        });
    });

    test("should authenticate a user using PAT sent via headers", async () => {
        const { securityUserPAT } = useGqlHandler({
            plugins: [patAuthentication({ identityType: "admin" })]
        });

        const [createResponse] = await securityUserPAT.createPAT({ data: { name: "Test token" } });
        // expect(token).toMatch(/p[a-f0-9]{47}/);

        expect(createResponse).toEqual({
            data: {
                security: {
                    createPAT: {
                        data: {
                            pat: {
                                id: expect.any(String),
                                name: "Test token",
                                token: expect.any(String),
                                createdOn: expect.any(String)
                            },
                            token: expect.stringMatching(/p[a-f0-9]{47}/)
                        },
                        error: null
                    }
                }
            }
        });
        const { token, pat } = createResponse.data.security.createPAT.data;

        // "getCurrentUser" should return information about the owner of PAT
        const [getCurrentUserResponse] = await securityUserPAT.getCurrentUser(
            {},
            { Authorization: token }
        );

        expect(getCurrentUserResponse).toEqual({
            data: {
                security: {
                    getCurrentUser: {
                        data: {
                            login: adminData.login,
                            personalAccessTokens: [pat]
                        },
                        error: null
                    }
                }
            }
        });
    });
});
