import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { TaskHandler } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { IndexManagerFactory } from "~/abstractions/IndexManagerFactory.js";
import { ReindexRunner } from "~/tasks/reindex/abstractions/ReindexRunner.js";
import { EnableIndexingRunner } from "~/tasks/enableIndexing/abstractions/EnableIndexingRunner.js";
import { CreateIndexesRunner } from "~/tasks/createIndexes/abstractions/CreateIndexesRunner.js";
import { OnBeforeTrigger } from "~/tasks/createIndexes/abstractions/OnBeforeTrigger.js";
import { ensureCanTriggerSystemTask } from "~/tasks/ensureCanTriggerSystemTask.js";
import { ReindexTask } from "~/tasks/reindex/ReindexTask.js";
import { EnableIndexingTask } from "~/tasks/enableIndexing/EnableIndexingTask.js";
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

const createHandlers = (params: IAccessParams) => {
    const { identityContext, tenantContext } = createContexts(params);
    const container = new Container();
    container.registerInstance(IdentityContext, identityContext);
    container.registerInstance(TenantContext, tenantContext);
    container.registerInstance(IndexManagerFactory, {
        createIndexManager: () => ({})
    } as unknown as IndexManagerFactory.Interface);
    container.registerInstance(ReindexRunner, {} as ReindexRunner.Interface);
    container.registerInstance(EnableIndexingRunner, {} as EnableIndexingRunner.Interface);
    container.registerInstance(CreateIndexesRunner, {} as CreateIndexesRunner.Interface);
    container.registerInstance(OnBeforeTrigger, {
        run: async () => {}
    } as unknown as OnBeforeTrigger.Interface);

    return [ReindexTask, EnableIndexingTask, CreateIndexesTask].map(Task => {
        const definition = container.resolveImplementation(Task);
        return {
            definition,
            handler: container.resolveImplementation(definition.handler) as TaskHandler.Interface
        };
    });
};

const trigger = async (params: IAccessParams) => {
    const results: { id: string; error?: any }[] = [];
    for (const { definition, handler } of createHandlers(params)) {
        try {
            await handler.onBeforeTrigger!({
                data: {
                    definitionId: definition.id,
                    name: definition.title,
                    input: {}
                },
                definition
            } as any);
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
        expect(results).toHaveLength(3);
    });

    it("should refuse a full access identity in a non-root tenant", async () => {
        await expect(
            ensureCanTriggerSystemTask(createContexts({ tenant: "tenant-a" }))
        ).rejects.toMatchObject({ code: "NOT_AUTHORIZED" });

        const results = await trigger({ tenant: "tenant-a" });
        expect(results).toHaveLength(3);
        for (const result of results) {
            expect(result.error?.code).toBe("NOT_AUTHORIZED");
        }
    });

    it("should refuse a root tenant identity without full access", async () => {
        const results = await trigger({ fullAccess: false });
        expect(results).toHaveLength(3);
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

    it("should drop index settings from the reindex input", async () => {
        const [{ definition, handler }] = createHandlers({});
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

        await handler.onBeforeTrigger!({ data, definition } as any);

        expect(data.input).toEqual({
            matching: "headless-cms"
        });
    });
});
