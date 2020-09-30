import { mockedUser } from "./mocks";
import useGqlHandler from "./useGqlHandler";
import { createJwtToken } from "@webiny/api-security/testing";
import mdbid from "mdbid";
describe("Personal Access Tokens test", () => {
    const { invoke, database } = useGqlHandler();

    const initial = {
        user: null,
        jwt: null
    };
    beforeAll(async () => {
        initial.user = await database.collection("SecurityUser").insert(mockedUser);
        initial.jwt = createJwtToken(mockedUser);
    });

    test("should get PATs (no tokens)", async () => {
        const [body] = await invoke({
            headers: {
                authorization: initial.jwt
            },
            body: {
                query: GET_CURRENT_USER
            }
        });

        const user = body.data.security.getCurrentUser.data;
        expect(user).toBeTruthy();
        expect(user.id).toEqual(mockedUser.id);
        expect(user.personalAccessTokens).toEqual([]);
    });

    test("should create PAT", async () => {
        const [body1] = await invoke({
            headers: {
                authorization: initial.jwt
            },
            body: {
                query: CREATE_PAT,
                variables: {
                    userId: mockedUser.id,
                    tokenName: "token-1"
                }
            }
        });

        const id = body1.data.security.createPAT.data.pat.id;
        const token = body1.data.security.createPAT.data.token;

        expect(id).toBeTruthy();
        expect(body1.data).toEqual({
            security: {
                createPAT: {
                    data: {
                        pat: {
                            id,
                            name: "token-1",
                            token: token.substr(-4)
                        },
                        token
                    },
                    error: null
                }
            }
        });

        const [body2] = await invoke({
            headers: {
                authorization: initial.jwt
            },
            body: {
                query: GET_CURRENT_USER
            }
        });

        expect(body2.data).toEqual({
            security: {
                getCurrentUser: {
                    data: {
                        id: mockedUser.id,
                        personalAccessTokens: [
                            {
                                id: id,
                                name: "token-1",
                                token: token.substr(-4)
                            }
                        ]
                    },
                    error: null
                }
            }
        });

        const [body3] = await invoke({
            headers: {
                authorization: initial.jwt
            },
            body: {
                query: UPDATE_PAT,
                variables: {
                    tokenId: id,
                    tokenName: "token-1-updated"
                }
            }
        });

        expect(body3.data).toEqual({
            security: {
                updatePAT: {
                    data: {
                        id,
                        name: "token-1-updated",
                        token: token.substr(-4)
                    },
                    error: null
                }
            }
        });

        const [body4] = await invoke({
            headers: {
                authorization: initial.jwt
            },
            body: {
                query: GET_CURRENT_USER
            }
        });

        expect(body4.data).toEqual({
            security: {
                getCurrentUser: {
                    data: {
                        id: mockedUser.id,
                        personalAccessTokens: [
                            {
                                id: id,
                                name: "token-1-updated",
                                token: token.substr(-4)
                            }
                        ]
                    },
                    error: null
                }
            }
        });

        const [body5] = await invoke({
            headers: {
                authorization: initial.jwt
            },
            body: {
                query: DELETE_PAT,
                variables: {
                    tokenId: id
                }
            }
        });

        expect(body5.data).toEqual({
            security: {
                deletePAT: {
                    data: true,
                    error: null
                }
            }
        });

        const [body6] = await invoke({
            headers: {
                authorization: initial.jwt
            },
            body: {
                query: GET_CURRENT_USER
            }
        });

        const user = body6.data.security.getCurrentUser.data;
        expect(user).toBeTruthy();
        expect(user.id).toEqual(mockedUser.id);
        expect(user.personalAccessTokens).toEqual([]);
    });

    test("without permissions, updating other users should not be allowed", async () => {
        const id = mdbid();
        await database.collection("SecurityUser").insert({
            id,
            email: "some@thing.com"
        });

        const [body] = await invoke({
            headers: {
                authorization: null
            },
            body: {
                query: CREATE_PAT,
                variables: {
                    userId: mockedUser.id,
                    tokenName: "token-name-1"
                }
            }
        });

        expect(body.data).toEqual({
            security: {
                createPAT: {
                    data: null,
                    error: {
                        message: 'Not authorized (scope "security:user:crud" not found).',
                        data: null
                    }
                }
            }
        });

        const [body2] = await invoke({
            body: {
                query: CREATE_PAT,
                variables: {
                    userId: mockedUser.id,
                    tokenName: "token-name-1"
                }
            }
        });

        const { token, pat } = body2.data.security.createPAT.data;
        expect(body2.data).toEqual({
            security: {
                createPAT: {
                    data: {
                        pat: {
                            id: pat.id,
                            name: "token-name-1",
                            token: token.substr(-4)
                        },
                        token: token
                    },
                    error: null
                }
            }
        });
    });
});

const GET_CURRENT_USER = /* GraphQL */ `
    {
        security {
            getCurrentUser {
                data {
                    id
                    personalAccessTokens {
                        id
                        name
                        token
                    }
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

const CREATE_PAT = /* GraphQL */ `
    mutation createPAT($userId: ID, $tokenName: String!) {
        security {
            createPAT(name: $tokenName, userId: $userId) {
                data {
                    pat {
                        id
                        name
                        token
                    }
                    token
                }
                error {
                    message
                    data
                }
            }
        }
    }
`;

const UPDATE_PAT = /* GraphQL */ `
    mutation updatePAT($tokenId: ID!, $tokenName: String!) {
        security {
            updatePAT(id: $tokenId, data: { name: $tokenName }) {
                data {
                    id
                    name
                    token
                }
                error {
                    message
                    data
                }
            }
        }
    }
`;

const DELETE_PAT = /* GraphQL */ `
    mutation deletePAT($tokenId: ID!) {
        security {
            deletePAT(id: $tokenId) {
                data
                error {
                    message
                    data
                }
            }
        }
    }
`;
