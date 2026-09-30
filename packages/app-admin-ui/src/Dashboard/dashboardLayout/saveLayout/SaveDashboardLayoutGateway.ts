import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { SaveDashboardLayoutGateway as GatewayAbstraction } from "./abstractions.js";
import type { DashboardLayoutData } from "../types.js";

interface SaveDashboardLayoutResponse {
    adminUsers: {
        updateCurrentUser: {
            data: { dashboardLayout: DashboardLayoutData | null } | null;
            error: { message: string } | null;
        };
    };
}

const SAVE_DASHBOARD_LAYOUT_MUTATION = /* GraphQL */ `
    mutation SaveAdminDashboardLayout($layout: JSON!) {
        adminUsers {
            updateCurrentUser(data: { dashboardLayout: $layout }) {
                data {
                    dashboardLayout
                }
                error {
                    message
                }
            }
        }
    }
`;

class SaveDashboardLayoutGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(layout: DashboardLayoutData): Promise<DashboardLayoutData> {
        const response = await this.client.execute<SaveDashboardLayoutResponse>({
            query: SAVE_DASHBOARD_LAYOUT_MUTATION,
            variables: { layout }
        });

        const { data, error } = response.adminUsers.updateCurrentUser;
        if (error) {
            throw new Error(error.message);
        }

        return data?.dashboardLayout ?? layout;
    }
}

export const SaveDashboardLayoutGateway = GatewayAbstraction.createImplementation({
    implementation: SaveDashboardLayoutGatewayImpl,
    dependencies: [MainGraphQLClient]
});
