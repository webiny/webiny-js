import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { DashboardLayoutGateway as GatewayAbstraction } from "./abstractions.js";
import type { DashboardLayoutData } from "../types.js";

interface DashboardError {
    message: string;
}

interface ListDashboardsResponse {
    dashboard: {
        listDashboards: { data: DashboardLayoutData[] | null; error: DashboardError | null };
    };
}

interface UpdateDashboardResponse {
    dashboard: {
        updateDashboard: { data: DashboardLayoutData | null; error: DashboardError | null };
    };
}

const LIST_DASHBOARDS_QUERY = /* GraphQL */ `
    query ListDashboards {
        dashboard {
            listDashboards {
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

const UPDATE_DASHBOARD_MUTATION = /* GraphQL */ `
    mutation UpdateDashboard($data: DashboardInput!) {
        dashboard {
            updateDashboard(data: $data) {
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
        const response = await this.client.execute<ListDashboardsResponse>({
            query: LIST_DASHBOARDS_QUERY
        });

        const { data, error } = response.dashboard.listDashboards;
        if (error) {
            throw new Error(error.message);
        }

        // Each user has at most one dashboard for now.
        return data?.[0] ?? null;
    }

    async save(layout: DashboardLayoutData): Promise<DashboardLayoutData> {
        const response = await this.client.execute<UpdateDashboardResponse>({
            query: UPDATE_DASHBOARD_MUTATION,
            variables: { data: layout }
        });

        const { data, error } = response.dashboard.updateDashboard;
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
