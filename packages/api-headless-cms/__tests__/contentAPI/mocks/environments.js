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
                        name: "new-environment-1"
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
                            id: mockedEnvironmentId,
                            name: "Initial Environment",
                            createdFrom: null,
                            environmentAliases: []
                        },
                        {
                            id: environmentId,
                            name: "new-environment-list-envs-test-1",
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
