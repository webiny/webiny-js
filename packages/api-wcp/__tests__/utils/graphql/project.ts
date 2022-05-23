export const GET_PROJECT_QUERY = /* GraphQL */ `
    query GetProjectQuery {
        wcp {
            getProject {
                data {
                    package {
                        features {
                            seats {
                                enabled
                                options
                            }
                            multiTenancy {
                                enabled
                            }
                            advancedPublishingWorkflow {
                                enabled
                            }
                        }
                    }
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;
