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

const GET_MY_DASHBOARD = /* GraphQL */ `
    query GetMyDashboard {
        dashboard {
            getMyDashboard {
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

const SAVE_MY_DASHBOARD = /* GraphQL */ `
    mutation SaveMyDashboard($data: DashboardLayoutInput!) {
        dashboard {
            saveMyDashboard(data: $data) {
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

interface DashboardLayoutResponse {
    data: DashboardLayout | null;
    error: { code: string; message: string } | null;
}

interface GetMyDashboardResponse {
    data: { dashboard: { getMyDashboard: DashboardLayoutResponse } };
}

interface SaveMyDashboardResponse {
    data: { dashboard: { saveMyDashboard: DashboardLayoutResponse } };
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
        async getMyDashboard() {
            const response = await invoke<GetMyDashboardResponse>(GET_MY_DASHBOARD);
            return response.data.dashboard.getMyDashboard;
        },
        async saveMyDashboard(data: DashboardLayout) {
            const response = await invoke<SaveMyDashboardResponse>(SAVE_MY_DASHBOARD, { data });
            return response.data.dashboard.saveMyDashboard;
        }
    };
};
