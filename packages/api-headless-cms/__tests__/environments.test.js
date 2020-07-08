import useGqlHandler from "./utils/useGqlHandler";
import { createEnvironment, createEnvironmentAlias } from "@webiny/api-headless-cms/testing";
import mocks from "./mocks/environments";

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
                    environmentAliases {
                        id
                        name
                        slug
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
                    environmentAliases {
                        id
                        name
                        slug
                    }
                    slug
                }
            }
        }
    }
`;

describe("Environments test", () => {
    const { invoke, database } = useGqlHandler();

    afterEach(async () => {
        await database.collection("CmsEnvironment").remove({}, { multi: true });
        await database.collection("CmsEnvironmentAlias").remove({}, { multi: true });
    });

    it("should create a new environment", async () => {
        const initial = { environment: await createEnvironment({ database }) };

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
                        createdFrom: initial.environment.id
                    }
                }
            }
        });

        // link `environment with alias`
        await createEnvironmentAlias({
            database,
            environmentId: body.data.cms.createEnvironment.data.id
        });

        expect(body.data.cms.createEnvironment.data.id).toBeTruthy();
        expect(body.data.cms.createEnvironment.data.createdFrom.id).toBe(initial.environment.id);
    });

    it(`should utilize "where" filtering correctly`, async () => {
        const initial = { environment: await createEnvironment({ database }) };
        await invoke({
            body: {
                query: CREATE_ENVIRONMENT,
                variables: {
                    data: {
                        name: "new-environment-1",
                        createdFrom: initial.environment.id
                    }
                }
            }
        });

        let [body] = await invoke({
            body: {
                query: GET_ENVIRONMENT,
                variables: {
                    where: {
                        name: "new-environment-1"
                    }
                }
            }
        });

        expect(body).toEqual(
            mocks.getEnvironments({ environmentId: body.data.cms.getEnvironment.data.id })
        );
    });

    it("should be able to list environments with alias", async () => {
        const initial = { environment: await createEnvironment({ database }) };

        let environmentsList = await database.collection("CmsEnvironment").find();
        expect(environmentsList.length).toBe(1);
        const [createdEnvironmentBody] = await invoke({
            body: {
                query: CREATE_ENVIRONMENT,
                variables: {
                    data: {
                        name: "new-environment-list-envs-test-1",
                        createdFrom: initial.environment.id
                    }
                }
            }
        });

        environmentsList = await database.collection("CmsEnvironment").find();
        expect(environmentsList.length).toBe(2);

        // link `environment with alias`
        await createEnvironmentAlias({
            database,
            environmentId: createdEnvironmentBody.data.cms.createEnvironment.data.id
        });

        let [body] = await invoke({
            body: {
                query: LIST_ENVIRONMENTS
            }
        });

        expect(body).toEqual(
            mocks.listEnvironments({
                environmentId: createdEnvironmentBody.data.cms.createEnvironment.data.id
            })
        );
    });
});
