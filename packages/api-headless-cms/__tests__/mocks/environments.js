import { environmentId as mockedEnvironmentId } from "@webiny/api-headless-cms/testing/createEnvironment";
import { environmentAliasId } from "@webiny/api-headless-cms/testing/createEnvironmentAlias";

export default {
    getEnvironments: ({ environmentId }) => ({
        data: {
            cms: {
                getEnvironment: {
                    data: {
                        createdFrom: {
                            id: "e1e1e1e1e1e1e1e1e1e1e1e1",
                            name: "Initial Environment"
                        },
                        environmentAliases: [],
                        id: environmentId,
                        name: "New Environment 1",
                        slug: "new-environment-1"
                    }
                }
            }
        }
    }),
    listEnvironments: ({ environmentId }) => ({
        data: {
            cms: {
                listEnvironments: {
                    data: [
                        {
                            contentModels: [],
                            id: mockedEnvironmentId,
                            name: "Initial Environment",
                            slug: "initial-environment",
                            createdFrom: null,
                            environmentAliases: []
                        },
                        {
                            contentModels: [],
                            id: environmentId,
                            name: "New Environment List Envs Test 1",
                            slug: "new-environment-list-envs-test-1",
                            createdFrom: {
                                id: mockedEnvironmentId,
                                name: "Initial Environment"
                            },
                            environmentAliases: [
                                {
                                    id: environmentAliasId,
                                    name: "Production",
                                    slug: "production"
                                }
                            ]
                        }
                    ]
                }
            }
        }
    })
};
