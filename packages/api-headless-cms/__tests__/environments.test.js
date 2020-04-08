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
                    createdFrom {
                        id
                        name
                    }
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

    beforeAll(async () => {
        await getCollection("CmsEnvironment").insertOne({
            id: initialEnvironment.id,
            name: "Initial Environment",
            description: "This is the initial environment.",
            createdFrom: null
        });
    });

    it("should create a new environment", async () => {
        let [body] = await invoke({
            body: {
                query: CREATE_ENVIRONMENT,
                variables: {
                    data: {
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
                        createdFrom: initialEnvironment.id
                    }
                }
            }
        });

        expect(body.data.cms.createEnvironment.data.id).toBeTruthy();
        expect(body.data.cms.createEnvironment.data.createdFrom.id).toBeTruthy();
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
