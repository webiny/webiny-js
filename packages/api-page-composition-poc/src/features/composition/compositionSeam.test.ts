import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { RunRepository } from "@webiny/api-component-extraction/domain/abstractions.js";
import { BlobStore, StageArtifactStore } from "@webiny/api-component-extraction/domain/stage.js";
import { PageMapStore } from "~/domain/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { PageMap } from "~/domain/types.js";
import { CompositionWriter, CompositionWriterImpl } from "./CompositionWriter.js";
import type { CompositionSource } from "./CompositionSource.js";
import { ComposePagesServiceImpl } from "../ComposePagesService.js";

/*
 * The seam between the extraction tenant and a site's tenant (compose-tenant-promotion-design.md).
 * A read in the wrong tenant does not fail, it returns the other tenant's data, so the guarantee is
 * structural: the writer cannot reach extraction data, and only the writer runs in the target.
 */

type Tenant = { id: string };
const tenantContextAt = (initial: string) => {
    let current: Tenant = { id: initial };
    return {
        getTenant: () => current,
        setTenant: (tenant: Tenant) => {
            current = tenant;
        },
        withTenant: async <T>(tenant: Tenant, cb: (tenant: Tenant) => Promise<T>) => {
            const previous = current;
            current = tenant;
            try {
                return await cb(tenant);
            } finally {
                current = previous;
            }
        }
    };
};

const source = (earlier: CompositionSource["earlier"]): CompositionSource => ({
    runId: "run-1",
    jobId: "job-1",
    assemble: { pages: [] } as never,
    generated: [],
    segmentByUrl: new Map(),
    trees: new Map(),
    promoted: [{ signature: "s", componentId: "root-component", name: "Job/Hero" }],
    images: [],
    composeVersion: 3,
    earlier
});

const page = (pageId: string) => ({ pageId }) as never;

describe("composition seam", () => {
    it("gives the writer no extraction dependency, so it cannot read extraction data", () => {
        const dependencies = (
            Reflect as unknown as { getMetadata(key: string, target: unknown): unknown[] }
        ).getMetadata("wby:dependencies", CompositionWriter) as unknown[];
        const names = dependencies.map(dependency => String(dependency));
        // The names are comparable: a dependency the writer does have shows up, distinct from the rest.
        expect(names).toContain(String(TenantContext));
        expect(new Set(names).size).toBe(names.length);
        for (const forbidden of [RunRepository, StageArtifactStore, BlobStore, PageMapStore]) {
            expect(names).not.toContain(String(forbidden));
        }
    });

    it("writes nothing when it is not running in the tenant it was given", async () => {
        const calls: string[] = [];
        const record = (name: string) => async () => {
            calls.push(name);
            return Result.ok({} as never);
        };
        const writer = new CompositionWriterImpl(
            tenantContextAt("root") as never,
            { execute: record("createPage") } as never,
            { execute: record("publishPage") } as never,
            { execute: record("unpublishPage") } as never,
            { execute: record("getPageByPath") } as never,
            { execute: record("updatePage") } as never,
            { execute: record("getComponent") } as never,
            {
                clear: () => calls.push("clear"),
                prime: async () => {},
                resolve: () => null
            } as never
        );
        const result = await writer.write({
            source: source([]),
            promoted: [],
            retire: [],
            expectedTenantId: "site"
        });
        expect(result.isFail()).toBe(true);
        expect(calls).toEqual([]);
    });

    it("reads and records in the extraction tenant, writes only inside the target", async () => {
        const tenants = tenantContextAt("root");
        const seen: Record<string, string> = {};
        let writtenWith: {
            retire: unknown[];
            promoted: unknown[];
            expectedTenantId: string;
        } | null = null;
        let stored: PageMap | null = null;

        const service = new ComposePagesServiceImpl(
            tenants as never,
            {
                read: async (_runId: string, tenantId?: string) => {
                    seen.read = tenants.getTenant().id;
                    seen.readFor = tenantId ?? "own";
                    return Result.ok(
                        source([
                            { runId: "run-1", pages: [page("root-old")] },
                            { runId: "run-0", tenantId: "site", pages: [page("site-old")] },
                            { runId: "run-x", tenantId: "other", pages: [page("other-old")] }
                        ])
                    );
                }
            } as never,
            {
                write: async (input: never) => {
                    seen.write = tenants.getTenant().id;
                    writtenWith = input;
                    return Result.ok({
                        created: [page("site-new")],
                        failed: [],
                        links: {} as never,
                        discarded: [],
                        kept: [],
                        dropped: []
                    });
                }
            } as never,
            {
                get: async () => Result.ok(null),
                set: async (map: PageMap) => {
                    seen.store = tenants.getTenant().id;
                    stored = map;
                    return Result.ok(undefined);
                }
            } as never
        );

        const result = await service.execute("run-1", {
            tenant: { id: "site" } as never,
            promoted: [{ signature: "s", componentId: "site-component", name: "Job/Hero" }]
        });

        expect(result.isOk()).toBe(true);
        // Read in the extraction tenant, for the site tenant's earlier compositions.
        expect(seen).toEqual({ read: "root", readFor: "site", write: "site", store: "root" });
        expect(tenants.getTenant().id).toBe("root");
        // The target's own components, not the extraction tenant's Promote output.
        expect(writtenWith!.promoted).toEqual([
            { signature: "s", componentId: "site-component", name: "Job/Hero" }
        ]);
        // Only earlier pages in the target tenant are retired; root's and another tenant's are not.
        expect(writtenWith!.retire).toEqual([page("site-old")]);
        expect(writtenWith!.expectedTenantId).toBe("site");
        expect(stored!.tenantId).toBe("site");
        expect(stored!.composeVersion).toBe(3);
    });

    it("composes drafts into the site tenant: writes them as drafts, retires nothing, keeps them apart", async () => {
        const tenants = tenantContextAt("root");
        let writtenWith: { retire: unknown[]; drafts?: boolean; expectedTenantId: string } | null =
            null;
        let stored: PageMap | null = null;

        const service = new ComposePagesServiceImpl(
            tenants as never,
            {
                read: async () =>
                    Result.ok(
                        source([{ runId: "run-0", tenantId: "site", pages: [page("site-live")] }])
                    )
            } as never,
            {
                write: async (input: never) => {
                    writtenWith = input;
                    return Result.ok({
                        created: [page("site-draft")],
                        failed: [],
                        links: {} as never,
                        discarded: [],
                        kept: [],
                        dropped: []
                    });
                }
            } as never,
            {
                get: async () => Result.ok(null),
                set: async (map: PageMap) => {
                    stored = map;
                    return Result.ok(undefined);
                }
            } as never
        );

        const result = await service.execute(
            "run-1",
            {
                tenant: { id: "site" } as never,
                promoted: [{ signature: "s", componentId: "site-component", name: "Hero" }]
            },
            { drafts: true }
        );

        expect(result.isOk()).toBe(true);
        expect(writtenWith!.drafts).toBe(true);
        // The site's live pages stay until the drafts are published.
        expect(writtenWith!.retire).toEqual([]);
        expect(writtenWith!.expectedTenantId).toBe("site");
        // Recorded as drafts, under its own key, never as the site's published map.
        expect(stored!.drafts).toBe(true);
        expect(stored!.tenantId).toBe("site");
    });

    it("refuses drafts without a site tenant to write them into", async () => {
        const service = new ComposePagesServiceImpl(
            tenantContextAt("root") as never,
            {} as never,
            {} as never,
            {} as never
        );
        const result = await service.execute("run-1", undefined, { drafts: true });
        expect(result.isFail()).toBe(true);
    });

    it("without a target composes in the run's own tenant, as before", async () => {
        const tenants = tenantContextAt("root");
        let writtenWith: {
            retire: unknown[];
            promoted: unknown[];
            expectedTenantId: string;
        } | null = null;
        let stored: PageMap | null = null;
        const service = new ComposePagesServiceImpl(
            tenants as never,
            {
                read: async () =>
                    Result.ok(
                        source([
                            { runId: "run-1", pages: [page("root-old")] },
                            { runId: "run-0", tenantId: "site", pages: [page("site-old")] }
                        ])
                    )
            } as never,
            {
                write: async (input: never) => {
                    writtenWith = input;
                    return Result.ok({
                        created: [],
                        failed: [],
                        links: {} as never,
                        discarded: [],
                        kept: [],
                        dropped: []
                    });
                }
            } as never,
            {
                set: async (map: PageMap) => {
                    stored = map;
                    return Result.ok(undefined);
                }
            } as never
        );

        await service.execute("run-1");

        expect(writtenWith!.promoted).toEqual([
            { signature: "s", componentId: "root-component", name: "Job/Hero" }
        ]);
        expect(writtenWith!.retire).toEqual([page("root-old")]);
        expect(writtenWith!.expectedTenantId).toBe("root");
        expect(stored!.tenantId).toBeUndefined();
    });
});
