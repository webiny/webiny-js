import mdbid from "mdbid";
import { createUtils } from "./utils";
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

describe("Environments test", () => {
    const { useDatabase, useApolloHandler } = createUtils();
    const { getCollection } = useDatabase();
    const { invoke } = useApolloHandler();
    const initialEnvironment = { id: mdbid() };
    const modelId = { id: mdbid() };
    const accessTokenInput = {
        name: "Access Token #1",
        description: "description...",
        environments: initialEnvironment.id
    };
    const accessTokenInputResponse = {
        name: "Access Token #1",
        description: "description...",
        environments: [
            {
                id: initialEnvironment.id,
                name: "Test Environment"
            }
        ]
    };
    const newTokenName = "Access Token #1 (renamed)";
    let createdAccessToken;
    beforeAll(async () => {
        await getCollection("CmsEnvironment").insertOne({
            id: initialEnvironment.id,
            name: "Test Environment",
            description: "... test env description ...",
            createdFrom: null
        });

        await getCollection("CmsContentModel").insertOne({
            id: modelId,
            environment: initialEnvironment.id,
            name: "Test Model"
        });

        process.env.TEST_ENV_ID = initialEnvironment.id
    });
    it("Should create an Access Token", async () => {
        let [{ errors, data }] = await invoke({
            body: {
                query: CREATE_ACCESS_TOKEN,
                variables: {
                    data: accessTokenInput
                }
            }
        });
        if (errors || data.cms.createAccessToken.error) {
            throw JSON.stringify(errors || data.cms.createAccessToken.error, null, 2);
        }
        createdAccessToken = data.cms.createAccessToken.data;
        expect(createdAccessToken).toMatchObject(accessTokenInputResponse);
        expect(createdAccessToken.id).toBeTruthy();
        expect(createdAccessToken.token).toBeTruthy();
        expect(createdAccessToken.environments).toBeTruthy();
        expect(createdAccessToken.scopes.length).toBeGreaterThanOrEqual(2);
        expect(createdAccessToken.scopes[0].split(":").length).toEqual(4);
    });
    it("Should list access tokens", async () => {
        let [{ errors, data }] = await invoke({
            body: {
                query: LIST_ACCESS_TOKENS
            }
        });
        if (errors) {
            throw JSON.stringify(errors, null, 2);
        }
        expect(data.cms.listAccessTokens.data.length).toEqual(1);
        expect(data.cms.listAccessTokens.data[0]).toMatchObject(createdAccessToken);
    });
    it("Should get access token", async () => {
        let [{ errors, data }] = await invoke({
            body: {
                query: GET_ACCESS_TOKEN,
                variables: {
                    id: createdAccessToken.id
                }
            }
        });
        if (errors) {
            throw JSON.stringify(errors, null, 2);
        }
        expect(data.cms.getAccessToken.data).toMatchObject(createdAccessToken);
    });
    it("Should update access token", async () => {
        let [{ errors, data }] = await invoke({
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
        if (errors) {
            throw JSON.stringify(errors, null, 2);
        }
        expect(data.cms.updateAccessToken.data.name).toEqual(newTokenName);
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
        if (errors) {
            throw JSON.stringify(errors, null, 2);
        }
        expect(data.cms.deleteAccessToken.data).toEqual(true);
    });

    it("Should get access token (null after deletion)", async () => {
        let [{ errors, data }] = await invoke({
            body: {
                query: GET_ACCESS_TOKEN,
                variables: {
                    id: createdAccessToken.id
                }
            }
        });
        if (errors) {
            throw JSON.stringify(errors, null, 2);
        }
        expect(data.cms.getAccessToken.data).toBeNull();
    });
});
