import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { ListTenantsUseCase } from "@webiny/api-core/features/tenancy/ListTenants/index.js";
import { TenantScopes } from "@webiny/api-core/features/tenancy/TenantScopes/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { Logger } from "@webiny/api-core/features/logger/abstractions.js";
import { ListScheduledActionsUseCase } from "@webiny/api-scheduler/features/ListScheduledActions/index.js";
import type { IPendingAction } from "@webiny/api-scheduler-standalone";
import { RecoverScheduledActionsHandler } from "~/scheduler/RecoverScheduledActionsHandler.js";
import { ScheduledActionRecoverInputHandler } from "~/scheduler/ScheduledActionRecoverInputHandler.js";
import { SchedulerSingleton } from "~/scheduler/abstractions/SchedulerSingleton.js";

const createTenant = (id: string, overrides: Partial<Tenant> = {}): Tenant => {
    const tenant = {
        id,
        name: id,
        parent: null,
        isInstalled: true,
        status: "active",
        ...overrides
    };
    return tenant as Tenant;
};

interface IPage {
    ids: string[];
    cursor?: string;
}

interface ISetup {
    tenants: Tenant[] | Error;
    // Pages of pending action ids per tenant, keyed by the `after` cursor they answer ("" for the first).
    pages: Record<string, Record<string, IPage> | Error>;
}

const createHandler = (setup: ISetup) => {
    let currentTenant: Tenant | null = null;
    const recovered: IPendingAction[] = [];
    const logged: unknown[] = [];

    const listTenants = {
        execute: async () => {
            if (setup.tenants instanceof Error) {
                return Result.fail(setup.tenants);
            }
            return Result.ok(setup.tenants);
        }
    };

    // Every tenant's scope is the test's container; the fakes read which tenant it is for.
    const tenantScopes = {
        withTenant: async <T>(tenant: Tenant, cb: (scope: any) => Promise<T>) => {
            const previous = currentTenant;
            currentTenant = tenant;
            try {
                return await cb({
                    tenant,
                    storage: "default",
                    resolve: (abstraction: any) => container.resolve(abstraction),
                    resolveAll: (abstraction: any) => container.resolveAll(abstraction)
                });
            } finally {
                currentTenant = previous;
            }
        }
    };

    const identityContext = {
        withoutAuthorization: <T>(cb: () => Promise<T>) => cb()
    };

    // Answers for whichever tenant is current, so a wrong tenant context reads the wrong pages.
    const listScheduledActions = {
        execute: async (params: { after?: string }) => {
            const tenantPages = setup.pages[currentTenant!.id];
            if (tenantPages instanceof Error) {
                return Result.fail(tenantPages);
            }
            const page = tenantPages[params.after ?? ""];
            const items = page.ids.map(id => {
                return { id, namespace: "Cms/Entry/article", scheduledFor: new Date() };
            });
            const meta = { cursor: page.cursor ?? null, hasMoreItems: Boolean(page.cursor) };
            return Result.ok({ items, meta });
        }
    };

    const scheduler = {
        recover: vi.fn(async (actions: IPendingAction[]) => {
            recovered.push(...actions);
        })
    };

    const logger = {
        error: vi.fn((...args: unknown[]) => {
            logged.push(args);
        })
    };

    const container = new Container();
    container.registerInstance(ListTenantsUseCase, listTenants as any);
    container.registerInstance(TenantScopes, tenantScopes as any);
    container.registerInstance(IdentityContext, identityContext as any);
    container.registerInstance(ListScheduledActionsUseCase, listScheduledActions as any);
    container.registerInstance(SchedulerSingleton, scheduler as any);
    container.registerInstance(Logger, logger as any);
    container.register(RecoverScheduledActionsHandler);
    const handler = container.resolve(ScheduledActionRecoverInputHandler);

    const run = () => {
        return handler.execute({ input: {} as any }, async () => undefined);
    };

    return { run, recovered, logged };
};

const recoveredPairs = (actions: IPendingAction[]) => {
    return actions.map(action => `${action.tenant}:${action.id}`);
};

describe("RecoverScheduledActionsHandler", () => {
    it("recovers every tenant's pending actions under that tenant", async () => {
        const { run, recovered } = createHandler({
            tenants: [createTenant("root"), createTenant("acme")],
            pages: {
                root: { "": { ids: ["r1"] } },
                acme: { "": { ids: ["a1", "a2"] } }
            }
        });

        const result = await run();

        expect(result).toEqual({ recovered: 3, failedTenants: [] });
        const pairs = recoveredPairs(recovered);
        expect(pairs).toEqual(["root:r1", "acme:a1", "acme:a2"]);
    });

    it("skips tenants that are not installed or are disabled", async () => {
        const { run, recovered } = createHandler({
            tenants: [
                createTenant("root"),
                createTenant("fresh", { isInstalled: false }),
                createTenant("paused", { status: "disabled" })
            ],
            pages: { root: { "": { ids: ["r1"] } } }
        });

        const result = await run();

        expect(result).toEqual({ recovered: 1, failedTenants: [] });
        const pairs = recoveredPairs(recovered);
        expect(pairs).toEqual(["root:r1"]);
    });

    it("reads every page of a tenant", async () => {
        const { run, recovered } = createHandler({
            tenants: [createTenant("root")],
            pages: {
                root: {
                    "": { ids: ["r1"], cursor: "c1" },
                    c1: { ids: ["r2"], cursor: "c2" },
                    c2: { ids: ["r3"] }
                }
            }
        });

        const result = await run();

        expect(result.recovered).toBe(3);
        const pairs = recoveredPairs(recovered);
        expect(pairs).toEqual(["root:r1", "root:r2", "root:r3"]);
    });

    it("still recovers the other tenants when one fails, and reports it", async () => {
        const { run, recovered, logged } = createHandler({
            tenants: [createTenant("root"), createTenant("broken"), createTenant("acme")],
            pages: {
                root: { "": { ids: ["r1"] } },
                broken: new Error("SQLITE_BUSY"),
                acme: { "": { ids: ["a1"] } }
            }
        });

        const result = await run();

        expect(result).toEqual({ recovered: 2, failedTenants: ["broken"] });
        const pairs = recoveredPairs(recovered);
        expect(pairs).toEqual(["root:r1", "acme:a1"]);
        expect(logged).toHaveLength(1);
    });

    it("recovers nothing on a fresh install with no tenants", async () => {
        const { run } = createHandler({ tenants: [], pages: {} });

        const result = await run();

        expect(result).toEqual({ recovered: 0, failedTenants: [] });
    });

    // A storage error used to read as "no root tenant yet" and recover nothing, silently.
    it("throws when the tenants cannot be listed", async () => {
        const { run } = createHandler({ tenants: new Error("connection refused"), pages: {} });

        await expect(run()).rejects.toThrow("connection refused");
    });
});
