import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import type { ActivityRecord } from "~/core/types.js";
import { ActivityLogPermissions } from "~/features/permissions/index.js";
import {
    ActivityChangesetFilter,
    ListActivityUseCase
} from "~/features/listActivity/abstractions.js";
import { ListActivityUseCase as ListActivityUseCaseImpl } from "~/features/listActivity/ListActivityUseCase.js";
import { PassThroughChangesetFilter } from "~/features/listActivity/PassThroughChangesetFilter.js";

const record = (overrides: Partial<ActivityRecord> = {}): ActivityRecord => ({
    id: "rec-1",
    targetType: "cms-entry",
    targetId: "abc",
    revision: "abc#0003",
    timestamp: "2026-09-10T08:30:00.000Z",
    actor: { id: "u-1", type: "admin", displayName: "Ada" },
    action: "entry.update",
    source: "admin",
    correlationId: "corr00000001",
    changeset: [{ path: "title", label: "Title" }],
    truncated: false,
    ...overrides
});

interface HarnessOptions {
    timeline?: boolean;
    actor?: boolean;
    modelFound?: boolean;
    entryReadable?: boolean;
    records?: ActivityRecord[];
    filter?: ActivityChangesetFilter.Interface;
}

const harness = (options: HarnessOptions = {}) => {
    const {
        timeline = true,
        actor = true,
        modelFound = true,
        entryReadable = true,
        records = [record()]
    } = options;

    const container = new Container();

    const getModel = vi.fn(async () =>
        modelFound
            ? Result.ok({ modelId: "article", fields: [] } as unknown as CmsModel)
            : Result.fail(new Error("no such model") as never)
    );
    const canAccessEntry = vi.fn(async () => entryReadable);
    const list = vi.fn(async () => Result.ok({ records, cursor: null, hasMore: false }));

    container.registerInstance(ActivityLogPermissions, {
        canAccess: async (entityId: string) => (entityId === "actor" ? actor : timeline)
    } as unknown as ActivityLogPermissions.Interface);

    container.registerInstance(GetModelUseCase, {
        execute: getModel
    } as unknown as GetModelUseCase.Interface);

    container.registerInstance(AccessControl, {
        canAccessEntry
    } as unknown as AccessControl.Interface);

    container.registerInstance(ActivityLogStorage, {
        append: vi.fn(),
        list,
        deleteAllForTarget: vi.fn()
    } as unknown as ActivityLogStorage.Interface);

    if (options.filter) {
        container.registerInstance(ActivityChangesetFilter, options.filter);
    } else {
        container.register(PassThroughChangesetFilter);
    }

    container.register(ListActivityUseCaseImpl);

    return {
        useCase: container.resolve(ListActivityUseCase),
        getModel,
        canAccessEntry,
        list
    };
};

const params = {
    target: { type: "cms-entry" as const, id: "abc" },
    modelId: "article"
};

describe("ListActivityUseCase — the permission matrix", () => {
    it("returns records with both permissions", async () => {
        const { useCase } = harness();

        const result = await useCase.execute(params);

        expect(result.isOk()).toBe(true);
        expect(result.isOk() && result.value.records).toHaveLength(1);
    });

    it("denies without activityLog.timeline", async () => {
        const { useCase } = harness({ timeline: false });

        const result = await useCase.execute(params);

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error.code).toBe("ActivityLog/NotAuthorized");
    });

    it("returns records with timeline but not actor", async () => {
        const { useCase } = harness({ actor: false });

        const result = await useCase.execute(params);

        expect(result.isOk()).toBe(true);
        expect(result.isOk() && result.value.records).toHaveLength(1);
    });

    it("denies with neither permission", async () => {
        const { useCase } = harness({ timeline: false, actor: false });

        expect((await useCase.execute(params)).isFail()).toBe(true);
    });

    it("denies when the entry is not readable", async () => {
        const { useCase } = harness({ entryReadable: false });

        const result = await useCase.execute(params);

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error.code).toBe("ActivityLog/NotAuthorized");
    });
});

describe("check order does not leak existence", () => {
    it("does not resolve the model when the permission is absent", async () => {
        // Resolving first and returning NotFound before authorising would turn this query into an
        // existence oracle over every entry in the installation.
        const { useCase, getModel } = harness({ timeline: false });

        await useCase.execute(params);

        expect(getModel).not.toHaveBeenCalled();
    });

    it("does not consult entry access when the permission is absent", async () => {
        const { useCase, canAccessEntry } = harness({ timeline: false });

        await useCase.execute(params);

        expect(canAccessEntry).not.toHaveBeenCalled();
    });

    it("reports a missing target and a forbidden one indistinguishably to the unauthorised", async () => {
        const missing = harness({ timeline: false, modelFound: false });
        const present = harness({ timeline: false, modelFound: true });

        const a = await missing.useCase.execute(params);
        const b = await present.useCase.execute(params);

        expect(a.isFail() && a.error.code).toBe(b.isFail() && (b.error as { code: string }).code);
    });

    it("still reports NotFound to a caller who is authorised", async () => {
        // The distinction is useful, and safe, once the caller has passed the permission check.
        const { useCase } = harness({ modelFound: false });

        const result = await useCase.execute(params);

        expect(result.isFail() && result.error.code).toBe("ActivityLog/TargetNotFound");
    });

    it("never reaches storage without both checks passing", async () => {
        const denied = harness({ entryReadable: false });

        await denied.useCase.execute(params);

        expect(denied.list).not.toHaveBeenCalled();
    });
});

describe("actor redaction", () => {
    it("blanks the actor but keeps the rest of the record", async () => {
        const { useCase } = harness({ actor: false });

        const result = await useCase.execute(params);
        const [only] = result.isOk() ? result.value.records : [];

        expect(only!.actor).toEqual({ id: "", type: "", displayName: "" });
        expect(only).toMatchObject({
            action: "entry.update",
            revision: "abc#0003",
            timestamp: "2026-09-10T08:30:00.000Z",
            changeset: [{ path: "title", label: "Title" }]
        });
    });

    it("carries no identity at all, not even a stable pseudonym", async () => {
        // A pseudonym is re-identifiable across a timeline by anyone who can correlate one record
        // with a known event.
        const { useCase } = harness({
            actor: false,
            records: [record({ actor: { id: "u-9", type: "admin", displayName: "Grace" } })]
        });

        const result = await useCase.execute(params);
        const serialised = JSON.stringify(result.isOk() ? result.value.records : []);

        expect(serialised).not.toContain("u-9");
        expect(serialised).not.toContain("Grace");
    });

    it("leaves the actor intact when the permission is held", async () => {
        const { useCase } = harness();

        const result = await useCase.execute(params);
        const [only] = result.isOk() ? result.value.records : [];

        expect(only!.actor).toEqual({ id: "u-1", type: "admin", displayName: "Ada" });
    });
});

describe("the actor filter", () => {
    it("is rejected without activityLog.actor rather than ignored", async () => {
        // Filtering by actor answers "did this person touch this entry" without rendering a name,
        // so it is an actor-identity operation. Ignoring it would silently hand back unfiltered
        // results, which is worse than refusing.
        const { useCase, list } = harness({ actor: false });

        const result = await useCase.execute({ ...params, actorId: "u-1" });

        expect(result.isFail()).toBe(true);
        expect(list).not.toHaveBeenCalled();
    });

    it("is passed to storage when the permission is held", async () => {
        const { useCase, list } = harness();

        await useCase.execute({ ...params, actorId: "u-1" });

        expect(list.mock.calls[0]![0]).toMatchObject({ actorId: "u-1" });
    });
});

describe("the changeset filter", () => {
    it("is a no-op by default, so every path is returned", async () => {
        // Correct behaviour today, not missing work: the CMS field permission evaluator returns
        // false unconditionally, so no field is restricted for anybody.
        const { useCase } = harness({
            records: [
                record({
                    changeset: [
                        { path: "title", label: "Title" },
                        { path: "salary", label: "Salary" }
                    ]
                })
            ]
        });

        const result = await useCase.execute(params);

        expect(result.isOk() && result.value.records[0]!.changeset).toHaveLength(2);
    });

    it("is applied when one is registered", async () => {
        const filter: ActivityChangesetFilter.Interface = {
            filter: async records =>
                records.map(r => ({
                    ...r,
                    changeset: r.changeset.filter(c => c.path !== "salary")
                }))
        };

        const { useCase } = harness({
            filter,
            records: [
                record({
                    changeset: [
                        { path: "title", label: "Title" },
                        { path: "salary", label: "Salary" }
                    ]
                })
            ]
        });

        const result = await useCase.execute(params);

        expect(result.isOk() && result.value.records[0]!.changeset).toEqual([
            { path: "title", label: "Title" }
        ]);
    });

    it("receives the resolved model, so a filter can resolve paths to fields", async () => {
        const filter = { filter: vi.fn(async (records: ActivityRecord[]) => records) };
        const { useCase } = harness({ filter });

        await useCase.execute(params);

        expect(filter.filter.mock.calls[0]![1]).toMatchObject({ modelId: "article" });
    });
});

describe("pagination", () => {
    it("passes the cursor through untouched and hands back the storage cursor", async () => {
        const container = new Container();
        const list = vi.fn(async () =>
            Result.ok({ records: [record()], cursor: "opaque-next", hasMore: true })
        );

        container.registerInstance(ActivityLogPermissions, {
            canAccess: async () => true
        } as unknown as ActivityLogPermissions.Interface);
        container.registerInstance(GetModelUseCase, {
            execute: async () =>
                Result.ok({ modelId: "article", fields: [] } as unknown as CmsModel)
        } as unknown as GetModelUseCase.Interface);
        container.registerInstance(AccessControl, {
            canAccessEntry: async () => true
        } as unknown as AccessControl.Interface);
        container.registerInstance(ActivityLogStorage, {
            append: vi.fn(),
            list,
            deleteAllForTarget: vi.fn()
        } as unknown as ActivityLogStorage.Interface);
        container.register(PassThroughChangesetFilter);
        container.register(ListActivityUseCaseImpl);

        const useCase = container.resolve(ListActivityUseCase);
        const result = await useCase.execute({ ...params, cursor: "opaque-prev", limit: 10 });

        expect(list.mock.calls[0]![0]).toMatchObject({ cursor: "opaque-prev", limit: 10 });
        expect(result.isOk() && result.value).toMatchObject({
            cursor: "opaque-next",
            hasMore: true
        });
    });
});
