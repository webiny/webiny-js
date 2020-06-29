import useGqlHandler from "./utils/useGqlHandler";
import { Database } from "@commodo/fields-storage-nedb";
import { createEnvironment, createEnvironmentAlias } from "@webiny/api-headless-cms/testing";

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
                    environmentAliases {
                        id
                        name
                        slug
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
                    environmentAliases {
                        id
                        name
                        slug
                    }
                }
            }
        }
    }
`;

describe("Environments test", () => {
    const database = new Database();
    const { invoke } = useGqlHandler({ database });

    const initial = {};

    beforeAll(async () => {
        initial.environment = await createEnvironment({ database });
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
        expect(body.data.cms.createEnvironment.data.createdFrom.id).toBeTruthy();
    });

    it(`should utilize "where" filtering correctly`, async () => {
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

        expect(body.data.cms.getEnvironment.data.id).toBeTruthy();
        // check for aliases
        expect(body.data.cms.getEnvironment.data.environmentAliases).toBeTruthy();
        expect(body.data.cms.getEnvironment.data.environmentAliases.length).toBe(1);
        expect(body.data.cms.getEnvironment.data.environmentAliases[0].name).toBeTruthy();
    });

    it("should be able to list environments with alias", async () => {
        let [body] = await invoke({
            body: {
                query: LIST_ENVIRONMENTS
            }
        });

        const initialListLength = body.data.cms.listEnvironments.data.length;

        const [createdEnvironmentBody] = await invoke({
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
            environmentId: createdEnvironmentBody.data.cms.createEnvironment.data.id
        });

        [body] = await invoke({
            body: {
                query: LIST_ENVIRONMENTS
            }
        });

        expect(body.data.cms.listEnvironments.data.length).toBe(initialListLength + 1);

        expect(
            body.data.cms.listEnvironments.data[initialListLength].environmentAliases.length
        ).toBe(1);

        expect(
            body.data.cms.listEnvironments.data[initialListLength].environmentAliases[0].name
        ).toBeTruthy();
        expect(
            body.data.cms.listEnvironments.data[initialListLength].environmentAliases[0].slug
        ).toBeTruthy();
    });
});
