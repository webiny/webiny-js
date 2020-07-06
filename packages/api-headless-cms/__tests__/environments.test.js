import mdbid from "mdbid";
import { createUtils } from "./utils";

const CREATE_ENVIRONMENT = /* GraphQL */ `
    mutation createEnvironment($data: CmsEnvironmentInput!) {
        cms {
            createEnvironment(data: $data) {
                data {
                    id
                    name
                    createdFrom {
                        id
                    }
                    contentModels {
                        id
                        modelId
                    }
                }
                error {
                    message
                    data
                }
            }
        }
    }
`;

const GET_ENVIRONMENT = /* GraphQL */ `
    query getEnvironment($where: JSON) {
        cms {
            getEnvironment(where: $where) {
                data {
                    id
                    name
                    createdFrom {
                        id
                        name
                    }
                    slug
                }
            }
        }
    }
`;

const LIST_ENVIRONMENTS = /* GraphQL */ `
    query listEnvironments {
        cms {
            listEnvironments {
                data {
                    id
                    name
                    contentModels {
                        modelId
                    }
                    createdFrom {
                        id
                        name
                    }
                    slug
                }
            }
        }
    }
`;

describe("Environments test", () => {
    const { useDatabase, useApolloHandler } = createUtils();
    const { invoke } = useApolloHandler();
    const { getCollection } = useDatabase();
    const initialEnvironment = { id: mdbid() };
    const modelId = { id: mdbid() };

    beforeAll(async () => {
        await getCollection("CmsEnvironment").insertOne({
            id: initialEnvironment.id,
            name: "Initial Environment",
            description: "This is the initial environment.",
            createdFrom: null,
            slug: "test slug"
        });

        await getCollection("CmsContentModel").insertOne({
            id: modelId,
            environment: initialEnvironment.id,
            modelId: "test-model-id",
            name: "Test Model"
        });

        // TODO [Andrei]: after fixing .find({}), clean this test: remove all comments
        console.log("Models inserted: ");
        console.log(
            await getCollection("CmsContentModel")
                .find({})
                .toArray()
        );
    });

    it("should create a new environment", async () => {
        let [body] = await invoke({
            body: {
                query: CREATE_ENVIRONMENT,
                variables: {
                    data: {
                        slug: "666",
                        name: "new-environment-1"
                    }
                }
            }
        });

        expect(body.data.cms.createEnvironment.error.message).toBe(
            'Base environment ("createdFrom" field) not set.'
        );

        [body] = await invoke({
            body: {
                query: CREATE_ENVIRONMENT,
                variables: {
                    data: {
                        name: "new-environment-1",
                        slug: "test-slug",
                        createdFrom: initialEnvironment.id
                    }
                }
            }
        });

        if (body.error) {
            throw body.error;
        }

        expect(body.data.cms.createEnvironment.data.id).toBeTruthy();
        expect(body.data.cms.createEnvironment.data.createdFrom.id).toBeTruthy();

        console.log(body.data.cms.createEnvironment.data.contentModels);
        expect(body.data.cms.createEnvironment.data.contentModels).toBeTruthy();

        // TODO [Andrei] [js]: make sure this test passes after contentModels is fixed
        // expect(body.data.cms.createEnvironment.data.contentModels.length).toEqual(1);
    });

    it("should not create two environments with the same slug", async () => {
        const [body] = await invoke({
            body: {
                query: CREATE_ENVIRONMENT,
                variables: {
                    data: {
                        name: "new-environment-1",
                        slug: "test-slug",
                        createdFrom: initialEnvironment.id
                    }
                }
            }
        });

        console.log(body.data.cms.createEnvironment);
        expect(body.data.cms.createEnvironment.error.message).toEqual(
            expect.stringMatching(/already exists/)
        );
    });

    it(`should utilize "where" filtering correctly`, async () => {
        let [body] = await invoke({
            body: {
                query: GET_ENVIRONMENT,
                variables: {
                    where: {
                        name: "Initial Environment"
                    }
                }
            }
        });

        expect(body.data.cms.getEnvironment.data.id).toBeTruthy();
        expect(body.data.cms.getEnvironment.data.slug).toBeTruthy();
        expect(body.data.cms.getEnvironment.data.createdFrom).toBeNull();
    });

    it("should be able to list environments", async () => {
        let [body] = await invoke({
            body: {
                query: LIST_ENVIRONMENTS
            }
        });

        const initialListLength = body.data.cms.listEnvironments.data.length;

        await invoke({
            body: {
                query: CREATE_ENVIRONMENT,
                variables: {
                    data: {
                        name: "new-environment-1",
                        slug: "some-slug",
                        createdFrom: initialEnvironment.id
                    }
                }
            }
        });

        [body] = await invoke({
            body: {
                query: LIST_ENVIRONMENTS
            }
        });

        expect(body.data.cms.listEnvironments.data.length).toBe(initialListLength + 1);
    });
});
