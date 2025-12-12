import { PluginsContainer } from "@webiny/plugins";
import type { PartialDeep } from "type-fest";
import { createMockIdentity } from "~tests/mocks/identity";
import type {
    Context,
    ITaskLogUpdateInput,
    ITaskUpdateData,
    IUpdateTaskResponse
} from "@webiny/tasks/types";
import type { ElasticsearchContext } from "@webiny/api-elasticsearch/types";
import { createMockApiLog } from "@webiny/project-utils/testing/mockApiLog";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";

export const createContextMock = (
    params?: PartialDeep<Context & ElasticsearchContext>
): Context & ElasticsearchContext => {
    const tenants: Tenant[] = [
        {
            id: "root",
            name: "Root",
            parent: null
        } as Tenant
    ];

    let currentTenant = tenants[0];
    return {
        tenancy: {
            listTenants: async () => {
                return tenants;
            },
            withEachTenant: async (input: Tenant[], cb: (t: Tenant) => Promise<any>) => {
                const initialTenant = currentTenant;
                try {
                    const results = [];
                    for (const t of input) {
                        currentTenant = t;
                        results.push(await cb(t));
                    }
                    return results;
                } finally {
                    currentTenant = initialTenant;
                }
            },
            getCurrentTenant() {
                return currentTenant;
            },
            setCurrentTenant(tenant: Tenant) {
                currentTenant = tenant;
            }
        },
        ...params,
        plugins: params?.plugins || new PluginsContainer(),
        tasks: {
            updateTask: async (
                id: string,
                data: Required<ITaskUpdateData>
            ): Promise<IUpdateTaskResponse> => {
                return {
                    ...data,
                    id,
                    startedOn: new Date().toISOString(),
                    finishedOn: undefined,
                    createdOn: new Date().toISOString(),
                    savedOn: new Date().toISOString(),
                    definitionId: "myCustomTaskDefinition",
                    createdBy: createMockIdentity(),
                    eventResponse: {} as any
                };
            },
            updateLog: async (id: string, data: ITaskLogUpdateInput) => {
                return {
                    ...data,
                    id,
                    createdOn: new Date().toISOString(),
                    createdBy: createMockIdentity()
                };
            },
            ...params?.tasks
        }
    } as unknown as Context & ElasticsearchContext;
};
