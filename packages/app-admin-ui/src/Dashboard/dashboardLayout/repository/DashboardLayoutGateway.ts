import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { DashboardLayoutGateway as GatewayAbstraction } from "./abstractions.js";
import type { DashboardLayoutData } from "../types.js";

interface DashboardLayoutResponse {
    data: DashboardLayoutData | null;
    error: { message: string } | null;
}

interface GetMyDashboardResponse {
    dashboard: { getMyDashboard: DashboardLayoutResponse };
}

interface SaveMyDashboardResponse {
    dashboard: { saveMyDashboard: DashboardLayoutResponse };
}

const GET_MY_DASHBOARD_QUERY = /* GraphQL */ `
    query GetMyDashboard {
        dashboard {
            getMyDashboard {
                data {
                    columns
                    hidden
                    columnCount
                }
                error {
                    message
                }
            }
        }
    }
`;

const SAVE_MY_DASHBOARD_MUTATION = /* GraphQL */ `
    mutation SaveMyDashboard($data: DashboardLayoutInput!) {
        dashboard {
            saveMyDashboard(data: $data) {
                data {
                    columns
                    hidden
                    columnCount
                }
                error {
                    message
                }
            }
        }
    }
`;

class DashboardLayoutGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async get(): Promise<DashboardLayoutData | null> {
        const response = await this.client.execute<GetMyDashboardResponse>({
            query: GET_MY_DASHBOARD_QUERY
        });

        const { data, error } = response.dashboard.getMyDashboard;
        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    async save(layout: DashboardLayoutData): Promise<DashboardLayoutData> {
        const response = await this.client.execute<SaveMyDashboardResponse>({
            query: SAVE_MY_DASHBOARD_MUTATION,
            variables: { data: layout }
        });

        const { data, error } = response.dashboard.saveMyDashboard;
        if (error) {
            throw new Error(error.message);
        }

        return data ?? layout;
    }
}

export const DashboardLayoutGateway = GatewayAbstraction.createImplementation({
    implementation: DashboardLayoutGatewayImpl,
    dependencies: [MainGraphQLClient]
});
