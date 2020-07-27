import { createContentModelGroup, createEnvironment } from "@webiny/api-headless-cms/testing";
import useGqlHandler from "./utils/useGqlHandler";
import mocks from "./mocks/accessTokens";

describe("Environments test", () => {
    const { invoke, database } = useGqlHandler();

    const newTokenName = "Access Token #1 (renamed)";
    let createdAccessToken;

    const initial = {};
    beforeAll(async () => {
        // Let's create a basic environment and a content model group.
        initial.environment = await createEnvironment({ database });
        initial.contentModelGroup = await createContentModelGroup({ database });
    });

    it("should create an Access Token", async () => {
        let [{ data }] = await invoke({
            body: {
                query: CREATE_ACCESS_TOKEN,
                variables: {
                    data: mocks.accessToken
                }
            }
        });

        expect(data.cms.createAccessToken.data).toEqual(
            mocks.accessTokenResponse({
                accessTokenId: data.cms.createAccessToken.data.id,
                token: data.cms.createAccessToken.data.token
            })
        );

        createdAccessToken = data.cms.createAccessToken.data;
    });

    it("Should list access tokens", async () => {
        let [body] = await invoke({
            body: {
                query: LIST_ACCESS_TOKENS
            }
        });

        expect(body.data.cms.listAccessTokens.data.length).toEqual(1);
        expect(body.data.cms.listAccessTokens.data[0]).toMatchObject(createdAccessToken);
    });

    it("Should get access token", async () => {
        let [{ data }] = await invoke({
            body: {
                query: GET_ACCESS_TOKEN,
                variables: {
                    id: createdAccessToken.id
                }
            }
        });
        expect(data.cms.getAccessToken.data).toMatchObject(createdAccessToken);
    });

    it("Should update access token", async () => {
        let [{ data }] = await invoke({
            body: {
                query: UPDATE_ACCESS_TOKEN,
                variables: {
                    id: createdAccessToken.id,
                    data: {
                        name: newTokenName
                    }
                }
            }
        });
        expect(data.cms.updateAccessToken.data.name).toEqual(newTokenName);
    });

    it("Should not update access token with invalid scopes", async () => {
        let [{ errors, data }] = await invoke({
            body: {
                query: UPDATE_ACCESS_TOKEN,
                variables: {
                    id: createdAccessToken.id,
                    data: {
                        scopes: ["asdf"]
                    }
                }
            }
        });

        expect(data.cms.updateAccessToken.data).toBeNull();
    });

    // TODO [Andrei] [js]: after fixing CmsContentModel.listContentModels, make sure this test works
    it.skip("Should update access token with valid scopes", async () => {
        let [{ errors, data }] = await invoke({
            body: {
                query: UPDATE_ACCESS_TOKEN,
                variables: {
                    id: createdAccessToken.id,
                    data: {
                        scopes: [`cms:read:${environment}:testModel`]
                    }
                }
            }
        });

        expect(createdAccessToken.scopes.length).toEqual(1);
        expect(createdAccessToken.scopes[0].split(":").length).toEqual(4);
    });

    it("Should delete access token", async () => {
        let [{ errors, data }] = await invoke({
            body: {
                query: DELETE_ACCESS_TOKEN,
                variables: {
                    id: createdAccessToken.id
                }
            }
        });
        expect(data.cms.deleteAccessToken.data).toEqual(true);
    });

    it("Should get access token (null after deletion)", async () => {
        let [{ data }] = await invoke({
            body: {
                query: GET_ACCESS_TOKEN,
                variables: {
                    id: createdAccessToken.id
                }
            }
        });
        expect(data.cms.getAccessToken.data).toBeNull();
    });
});

const CREATE_ACCESS_TOKEN = /* GraphQL */ `
    mutation createAccessToken($data: CmsAccessTokenCreateInput!) {
        cms {
            createAccessToken(data: $data) {
                data {
                    id
                    name
                    token
                    description
                    scopes
                    environments {
                        id
                        name
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

const LIST_ACCESS_TOKENS = /* GraphQL */ `
    {
        cms {
            listAccessTokens {
                data {
                    id
                    name
                    description
                    token
                    scopes
                    environments {
                        id
                        name
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const GET_ACCESS_TOKEN = /* GraphQL */ `
    query getAccessToken($id: ID!) {
        cms {
            getAccessToken(id: $id) {
                data {
                    id
                    name
                    description
                    token
                    scopes
                    environments {
                        id
                        name
                    }
                }
            }
        }
    }
`;

const UPDATE_ACCESS_TOKEN = /* GraphQL */ `
    mutation updateAccessToken($id: ID!, $data: CmsAccessTokenUpdateInput!) {
        cms {
            updateAccessToken(id: $id, data: $data) {
                data {
                    name
                    scopes
                }
            }
        }
    }
`;

const DELETE_ACCESS_TOKEN = /* GraphQL */ `
    mutation deleteAccessToken($id: ID!) {
        cms {
            deleteAccessToken(id: $id) {
                data
            }
        }
    }
`;
