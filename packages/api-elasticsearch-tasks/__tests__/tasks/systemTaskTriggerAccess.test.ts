import { describe, expect, it } from "vitest";
import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { IndexManagerFactory } from "~/settings/abstractions/IndexManagerFactory.js";
import type { ReindexingTaskRunner } from "~/tasks/reindexing/abstractions/ReindexingTaskRunner.js";
import type { EnableIndexingTaskRunner } from "~/tasks/enableIndexing/abstractions/EnableIndexingTaskRunner.js";
import type { ElasticsearchToDynamoDbSynchronization } from "~/tasks/dataSynchronization/elasticsearch/abstractions/ElasticsearchToDynamoDbSynchronization.js";
import type { CreateIndexesTaskRunner } from "~/tasks/createIndexes/abstractions/CreateIndexesTaskRunner.js";
import type { OnBeforeTrigger } from "~/tasks/createIndexes/abstractions/OnBeforeTrigger.js";
import { ensureCanTriggerSystemTask } from "~/tasks/ensureCanTriggerSystemTask.js";
import { ElasticsearchReindexingTask } from "~/tasks/reindexing/reindexingTaskDefinition.js";
import { ElasticsearchEnableIndexingTask } from "~/tasks/enableIndexing/index.js";
import { DataSynchronizationTask } from "~/tasks/dataSynchronization/DataSynchronizationTask.js";
import { CreateIndexesTask } from "~/tasks/createIndexes/CreateIndexesTask.js";

interface IAccessParams {
    tenant?: string;
    fullAccess?: boolean;
    authorization?: boolean;
}

const createContexts = (params: IAccessParams = {}) => {
    const { tenant = "root", fullAccess = true, authorization = true } = params;
    const identityContext = {
        isAuthorizationEnabled: () => authorization,
        hasFullAccess: async () => fullAccess
    } as unknown as IdentityContext.Interface;
    const tenantContext = {
        getTenant: () => ({ id: tenant })
    } as unknown as TenantContext.Interface;
    return { identityContext, tenantContext };
};

const indexManagerFactory = {
    createIndexManager: () => ({})
} as unknown as IndexManagerFactory.Interface;

const createDefinitions = (params: IAccessParams) => {
    const { identityContext, tenantContext } = createContexts(params);
    const onBeforeTriggerRunner = {
        run: async () => {}
    } as unknown as OnBeforeTrigger.Interface;
    return [
        new ElasticsearchReindexingTask(
            indexManagerFactory,
            {} as ReindexingTaskRunner.Interface,
            identityContext,
            tenantContext
        ),
        new ElasticsearchEnableIndexingTask(
            indexManagerFactory,
            {} as EnableIndexingTaskRunner.Interface,
            identityContext,
            tenantContext
        ),
        new DataSynchronizationTask(
            indexManagerFactory,
            {} as ElasticsearchToDynamoDbSynchronization.Interface,
            identityContext,
            tenantContext
        ),
        new CreateIndexesTask(
            indexManagerFactory,
            {} as CreateIndexesTaskRunner.Interface,
            onBeforeTriggerRunner,
            identityContext,
            tenantContext
        )
    ];
};

const trigger = async (params: IAccessParams, input: Record<string, any> = {}) => {
    const results: { id: string; error?: any }[] = [];
    for (const definition of createDefinitions(params)) {
        try {
            await definition.onBeforeTrigger!({
                data: {
                    definitionId: definition.id,
                    name: definition.title,
                    input: { ...input }
                }
            });
            results.push({ id: definition.id });
        } catch (error) {
            results.push({ id: definition.id, error });
        }
    }
    return results;
};

describe("system task trigger access", () => {
    it("should allow a full access identity in the root tenant", async () => {
        await expect(ensureCanTriggerSystemTask(createContexts())).resolves.toBeUndefined();

        const results = await trigger({});
        expect(results.every(result => !result.error)).toBe(true);
        expect(results).toHaveLength(4);
    });

    it("should refuse a full access identity in a non-root tenant", async () => {
        await expect(
            ensureCanTriggerSystemTask(createContexts({ tenant: "tenant-a" }))
        ).rejects.toMatchObject({ code: "NOT_AUTHORIZED" });

        const results = await trigger({ tenant: "tenant-a" });
        for (const result of results) {
            expect(result.error?.code).toBe("NOT_AUTHORIZED");
        }
    });

    it("should refuse a root tenant identity without full access", async () => {
        await expect(
            ensureCanTriggerSystemTask(createContexts({ fullAccess: false }))
        ).rejects.toMatchObject({ code: "NOT_AUTHORIZED" });

        const results = await trigger({ fullAccess: false });
        for (const result of results) {
            expect(result.error?.code).toBe("NOT_AUTHORIZED");
        }
    });

    it("should allow code that triggers with authorization disabled", async () => {
        await expect(
            ensureCanTriggerSystemTask(
                createContexts({ tenant: "tenant-a", fullAccess: false, authorization: false })
            )
        ).resolves.toBeUndefined();
    });

    it("should drop index settings from the reindexing input", async () => {
        const { identityContext, tenantContext } = createContexts();
        const definition = new ElasticsearchReindexingTask(
            indexManagerFactory,
            {} as ReindexingTaskRunner.Interface,
            identityContext,
            tenantContext
        );
        const data = {
            definitionId: definition.id,
            name: definition.title,
            input: {
                matching: "headless-cms",
                settings: {
                    "some-index": {
                        numberOfReplicas: 0,
                        refreshInterval: "-1"
                    }
                }
            }
        };

        await definition.onBeforeTrigger({ data });

        expect(data.input).toEqual({
            matching: "headless-cms"
        });
    });
});
