import { createImplementation } from "@webiny/di";
import { WcpGateway as WcpGatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { GetWcpProjectResponse, WcpProjectData } from "./types.js";

const GET_WCP_PROJECT = /* GraphQL */ `
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
                            recordLocking {
                                enabled
                            }
                            fileManager {
                                enabled
                                options
                            }
                            aiPowerups {
                                enabled
                                options
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

class WcpGraphQLGateway implements WcpGatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async fetchProject(): Promise<WcpProjectData | null> {
        const response = await this.client.execute<GetWcpProjectResponse>({
            query: GET_WCP_PROJECT,
            headers: {
                "x-tenant": "root"
            }
        });

        if (response.wcp.getProject.error) {
            throw new Error(response.wcp.getProject.error.message);
        }

        return response.wcp.getProject.data;
    }
}

export const WcpGateway = createImplementation({
    abstraction: WcpGatewayAbstraction,
    implementation: WcpGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
