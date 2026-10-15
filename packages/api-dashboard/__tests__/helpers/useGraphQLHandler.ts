import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { registerApiCoreStorageOperations } from "@webiny/api-core";
import { GraphQLEngineFeature } from "@webiny/api-graphql";
import { getStorageOps } from "@webiny/api-core/testing/environment.js";
import { TestIdentity } from "@webiny/api-core-testing";
import { TestAuthenticator } from "@webiny/api-core-testing";
import { TestPermissions } from "@webiny/api-core-testing";
import { TestAuthorizer } from "@webiny/api-core-testing";
import { AuthTriggerHandler } from "@webiny/api-core-testing";
import { RootTenantInitializer } from "@webiny/api-core-testing";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { DashboardLayout } from "~/domain/types.js";
import { DashboardAppFeature } from "~/index.js";

export const defaultIdentity: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

const LIST_DASHBOARDS = /* GraphQL */ `
    query ListDashboards {
        dashboard {
            listDashboards {
                data {
                    columns
                    hidden
                    columnCount
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const UPDATE_DASHBOARD = /* GraphQL */ `
    mutation UpdateDashboard($data: DashboardInput!) {
        dashboard {
            updateDashboard(data: $data) {
                data {
                    columns
                    hidden
                    columnCount
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

interface DashboardError {
    code: string;
    message: string;
}

interface DashboardResponse {
    data: DashboardLayout | null;
    error: DashboardError | null;
}

interface DashboardListResponse {
    data: DashboardLayout[] | null;
    error: DashboardError | null;
}

interface ListDashboardsResponse {
    data: { dashboard: { listDashboards: DashboardListResponse } };
}

interface UpdateDashboardResponse {
    data: { dashboard: { updateDashboard: DashboardResponse } };
}

export const useGraphQLHandler = (params: { identity?: IdentityData } = {}) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");

    const handler = createTestHttpHandler({
        root: container => {
            container.registerInstance(TestIdentity, params.identity ?? defaultIdentity);
            container.registerInstance(TestPermissions, { list: [{ name: "*" }] });
            container.register(TestAuthenticator);
            container.register(TestAuthorizer);
            container.registerDecorator(AuthTriggerHandler);
            container.registerDecorator(RootTenantInitializer);
        },
        child: async container => {
            registerApiCoreStorageOperations(container, apiCoreStorage.storageOperations);
            ApiCoreFeature.register(container, { wcpLicense: undefined });
            DashboardAppFeature.register(container);
            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async <T>(query: string, variables?: Record<string, any>): Promise<T> => {
        const response = await handler({
            method: "POST",
            path: "/graphql",
            headers: { "x-tenant": "root", "content-type": "application/json" },
            body: { query, variables }
        });
        return response.body as T;
    };

    return {
        async listDashboards() {
            const response = await invoke<ListDashboardsResponse>(LIST_DASHBOARDS);
            return response.data.dashboard.listDashboards;
        },
        async updateDashboard(data: DashboardLayout) {
            const response = await invoke<UpdateDashboardResponse>(UPDATE_DASHBOARD, { data });
            return response.data.dashboard.updateDashboard;
        }
    };
};
