import mdbid from "mdbid";
import { createUtils } from "./utils";

const CREATE_ACCESS_TOKEN = /* GraphQL */ `
    mutation createAccesstoken($data: CmsAccessTokenCreateInput!) {
        cms {
            createAccessToken(data: $data) {
                data {
                    id
                    name
                    description
                    token
                    # environments {
                    #     id
                    #     name
                    # }
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
    const { /*useDatabase,*/ useApolloHandler } = createUtils();
    // const { getCollection } = useDatabase();
    const { invoke } = useApolloHandler();
    // const initialEnvironment = { id: mdbid() };
    const accessTokenInput = {
        name: "Access Token #1",
        description: "description..."
        // environments: [initialEnvironment.id]
    };
    const newTokenName = "Access Token #1 (renamed)";
    let createdAccessToken;

    // beforeAll(async () => {
    //     await getCollection("CmsEnvironment").insertOne({
    //         id: initialEnvironment.id,
    //         name: "Test Environment",
    //         description: "... test env description ...",
    //         createdFrom: null
    //     });
    // });

    it.only("Should create an Access Token", async () => {
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
        expect(createdAccessToken).toMatchObject(accessTokenInput);
        expect(createdAccessToken.id).toBeTruthy();
        expect(createdAccessToken.token).toBeTruthy();
        // expect(createdAccessToken.environments).toBeTruthy();
        // console.log(createdAccessToken.environments);
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
        expect(data.cms.listAccessTokens.data[0]).toEqual(createdAccessToken);
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
        expect(data.cms.getAccessToken.data).toEqual(createdAccessToken);
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
