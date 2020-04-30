import accessTokenPlugins from "../src/plugins";
import { createUtils } from "./utils";
import { mockedUser } from "./mocks";
import { graphql } from "graphql";
import { JwtToken } from "../src/plugins/authentication";

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

describe("Personal Access Tokens [GraphQL] test suite", () => {
    const tokenSecret = "ghsgashdgu";
    const { useDatabase, useSchema } = createUtils([
        accessTokenPlugins({ token: { secret: tokenSecret } })
    ]);
    const db = useDatabase();
    let schema;
    let context;
    let tokenName1 = "Cool token #1";
    let tokenName2 = "Cool token #1 - Renamed";
    let createdToken;
    let updatedToken;

    beforeAll(async () => {
        await db.getCollection("SecurityUser").insertOne(mockedUser);
        delete mockedUser._id;

        const jwt = new JwtToken({ secret: tokenSecret });
        let payload = {
            id: mockedUser.id,
            type: "user",
            access: {
                scopes: [],
                roles: [],
                fullAccess: true
            }
        };
        const token = await jwt.encode(payload, new Date().getTime() + 999999999);

        ({ schema, context } = await useSchema());
        context.event = {
            headers: {
                authorization: token
            },
            httpMethod: "POST"
        };
    });

    test("Should get PATs (no tokens)", async () => {
        const response = await graphql(schema, GET_CURRENT_USER, {}, context);
        if (response.errors) {
            throw JSON.stringify(response.errors, null, 2);
        }
        const user = response.data.security.getCurrentUser.data;
        expect(user).toBeTruthy();
        expect(user.id).toEqual(mockedUser.id);
        expect(user.personalAccessTokens).toEqual([]);
    });
    test("Should create PAT", async () => {
        const response = await graphql(schema, CREATE_PAT, {}, context, {
            userId: mockedUser.id,
            tokenName: tokenName1
        });
        if (response.errors) {
            throw JSON.stringify(response.errors, null, 2);
        }
        const { error, data } = response.data.security.createPAT;
        if (error) {
            throw JSON.stringify(error, null, 2);
        }
        expect(data.token).toBeTruthy();
        expect(data.token.length).toEqual(48);
        expect(data.pat.id).toBeTruthy();
        expect(data.pat.name).toEqual(tokenName1);
        expect(data.pat.token).toBeTruthy();
        expect(data.pat.token.length).toEqual(4);
        createdToken = data.pat;
    });
    test("Should get PATs (1 token)", async () => {
        const response = await graphql(schema, GET_CURRENT_USER, {}, context);
        if (response.errors) {
            throw JSON.stringify(response.errors, null, 2);
        }
        const user = response.data.security.getCurrentUser.data;
        expect(user.personalAccessTokens).toEqual([createdToken]);
    });
    test("Should update PAT", async () => {
        const response = await graphql(schema, UPDATE_PAT, {}, context, {
            tokenId: createdToken.id,
            tokenName: tokenName2
        });
        if (response.errors) {
            throw JSON.stringify(response.errors, null, 2);
        }
        const { error, data: token } = response.data.security.updatePAT;
        if (error) {
            throw JSON.stringify(error, null, 2);
        }
        expect(token.name).toEqual(tokenName2);
        updatedToken = token;
    });
    test("Should get PATs (1 token, new value)", async () => {
        const response = await graphql(schema, GET_CURRENT_USER, {}, context);
        if (response.errors) {
            throw JSON.stringify(response.errors, null, 2);
        }
        const user = response.data.security.getCurrentUser.data;
        expect(user.personalAccessTokens).toEqual([updatedToken]);
    });
    test("Should delete PAT", async () => {
        const response = await graphql(schema, DELETE_PAT, {}, context, {
            tokenId: updatedToken.id
        });
        if (response.errors) {
            throw JSON.stringify(response.errors, null, 2);
        }
        const { error, data } = response.data.security.deletePAT;
        if (error) {
            throw JSON.stringify(error, null, 2);
        }
        expect(data).toEqual(true);
    });
    test("Should get PATs (no tokens)", async () => {
        const response = await graphql(schema, GET_CURRENT_USER, {}, context);
        if (response.errors) {
            throw JSON.stringify(response.errors, null, 2);
        }
        const user = response.data.security.getCurrentUser.data;
        expect(user.personalAccessTokens).toEqual([]);
    });
});
