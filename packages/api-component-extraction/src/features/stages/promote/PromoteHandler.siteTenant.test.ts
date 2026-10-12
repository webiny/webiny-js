import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { Result } from "@webiny/feature/api";
import { PromoteHandlerImpl } from "./PromoteHandler.js";

/*
 * Where stage 9 writes. A job created with `siteTenantFromStart` approves into its site tenant: every
 * Library call runs inside it and the artifact records it. Any other job approves into the extraction
 * tenant, as before. The component is Take 3's Perks section as Generate produced it, bundled for real.
 */
const component = JSON.parse(
    readFileSync(new URL("./__fixtures__/take3-perks-generated.json", import.meta.url), "utf8")
);

const setup = (siteTenantFromStart: boolean) => {
    let current = { id: "root" };
    const calls: Array<{ call: string; tenant: string }> = [];
    const tenantContext = {
        getTenant: () => current,
        withTenant: async (tenant: { id: string }, cb: () => Promise<unknown>) => {
            const before = current;
            current = tenant;
            try {
                return await cb();
            } finally {
                current = before;
            }
        }
    };
    const record = (call: string) => calls.push({ call, tenant: current.id });
    const listComponents = {
        execute: vi.fn(async () => {
            record("list");
            return Result.ok({ items: [], meta: {} });
        })
    };
    const createComponent = {
        execute: vi.fn(async (values: { name: string }) => {
            record("create");
            return Result.ok({ id: "component-1", name: values.name });
        })
    };
    const updateComponent = { execute: vi.fn() };
    const overrides = { listByJob: vi.fn(async () => Result.ok([])) };
    const siteTenant = {
        ensure: vi.fn(async () => Result.ok({ id: "rehearsalsite1234", name: "Rehearsal" }))
    };
    const written: Record<string, unknown> = {};
    const json: Record<string, unknown> = {
        assembly: { componentsRef: "generate" },
        generate: { components: [component] }
    };
    const context = {
        run: { id: "run-1", stages: [] },
        job: { id: "job-1", name: "Rehearsal", siteTenantFromStart },
        upstream: { assembly: "assembly" },
        artifactKey: (name: string) => name,
        store: {
            getJson: async (key: string) => Result.ok(json[key] ?? null),
            putJson: async (key: string, value: unknown) => {
                written[key] = value;
                return Result.ok(undefined);
            }
        },
        log: { info: async () => {}, error: async () => {} },
        progress: async () => {}
    };
    const handler = new PromoteHandlerImpl(
        createComponent,
        updateComponent,
        listComponents,
        overrides,
        tenantContext,
        siteTenant
    );
    return { handler, context, calls, written, siteTenant };
};

describe("stage 9's tenant", () => {
    it("approves into the site tenant for a job created with siteTenantFromStart", async () => {
        const { handler, context, calls, written, siteTenant } = setup(true);
        const outcome = await handler.execute(context);

        expect(outcome.isOk()).toBe(true);
        expect(siteTenant.ensure).toHaveBeenCalledTimes(1);
        expect(calls).toEqual([
            { call: "list", tenant: "rehearsalsite1234" },
            { call: "create", tenant: "rehearsalsite1234" }
        ]);
        expect((written.promotion as { tenantId?: string }).tenantId).toBe("rehearsalsite1234");
    }, 60_000);

    it("approves into the extraction tenant for any older job, and records no tenant", async () => {
        const { handler, context, calls, written, siteTenant } = setup(false);
        const outcome = await handler.execute(context);

        expect(outcome.isOk()).toBe(true);
        expect(siteTenant.ensure).not.toHaveBeenCalled();
        expect(calls).toEqual([
            { call: "list", tenant: "root" },
            { call: "create", tenant: "root" }
        ]);
        expect(written.promotion).not.toHaveProperty("tenantId");
    }, 60_000);
});
