(async () => {
    const { request, gql } = require("graphql-request");

    const GET_WCP_PROJECT = gql`
        query GetWcpProject {
            wcp {
                getProject {
                    data {
                        orgId
                        projectId
                        package {
                            features {
                                seats {
                                    enabled
                                    options
                                }
                                multiTenancy {
                                    enabled
                                    options
                                }
                                advancedPublishingWorkflow {
                                    enabled
                                }
                                advancedAccessControlLayer {
                                    enabled
                                    options
                                }
                                auditLogs {
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

    await request("https://d3jam8rit3rfos.cloudfront.net/graphql", GET_WCP_PROJECT).then(res => {
        console.log(JSON.stringify(res, null, 2));
    });
})();
