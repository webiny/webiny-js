import { beforeEach, describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import { ActivityLogPersistenceError } from "~/core/errors.js";
import { ActivitySourceResolver, EntryActivityRecorder } from "~/cms/recorder/abstractions.js";
import { EntryActivityRecorder as EntryActivityRecorderImpl } from "~/cms/recorder/EntryActivityRecorder.js";

/**
 * Failure containment is the hardest requirement in the feature.
 *
 * `EventPublisher` awaits handlers sequentially, inline, inside the write. A handler that rejects
 * propagates into the entry write *after* the entry has already been persisted, so the user is
 * shown a failed save of data that is in fact committed. Audit logs has exactly this defect today.
 *
 * Every test here is the same assertion from a different angle: whatever goes wrong,
 * `recorder.record()` resolves.
 */

const model = (overrides: Partial<CmsModel> = {}): CmsModel =>
    ({ modelId: "article", isPrivate: false, fields: [], ...overrides }) as CmsModel;

const entry = (overrides: Partial<CmsEntry> = {}): CmsEntry =>
    ({ id: "abc#0001", entryId: "abc", values: {}, ...overrides }) as CmsEntry;

interface Harness {
    recorder: EntryActivityRecorder.Interface;
    append: ReturnType<typeof vi.fn>;
}

const harness = (
    appendImpl: (...args: unknown[]) => unknown,
    options: { identityThrows?: boolean; sourceThrows?: boolean } = {}
): Harness => {
    const container = new Container();
    const append = vi.fn(appendImpl);

    container.registerInstance(ActivityLogStorage, {
        append,
        list: vi.fn(),
        deleteAllForTarget: vi.fn()
    } as unknown as ActivityLogStorage.Interface);

    container.registerInstance(IdentityContext, {
        getIdentity: () => {
            if (options.identityThrows) {
                throw new Error("identity exploded");
            }
            return {
                id: "u-1",
                type: "admin",
                displayName: "Ada",
                isAnonymous: () => false
            };
        }
    } as unknown as IdentityContext.Interface);

    container.registerInstance(ActivitySourceResolver, {
        resolve: () => {
            if (options.sourceThrows) {
                throw new Error("source exploded");
            }
            return "admin";
        }
    } as unknown as ActivitySourceResolver.Interface);

    container.register(EntryActivityRecorderImpl);

    return { recorder: container.resolve(EntryActivityRecorder), append };
};

const ok = () => Result.ok(entry() as never);

describe("recorder failure containment", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    it("resolves when storage returns a failed Result", async () => {
        const { recorder } = harness(() =>
            Result.fail(new ActivityLogPersistenceError(new Error("table gone")))
        );

        await expect(
            recorder.record({ model: model(), entry: entry(), action: "entry.update" })
        ).resolves.toBeUndefined();
    });

    it("resolves when storage rejects", async () => {
        const { recorder } = harness(() => Promise.reject(new Error("network down")));

        await expect(
            recorder.record({ model: model(), entry: entry(), action: "entry.update" })
        ).resolves.toBeUndefined();
    });

    it("resolves when storage throws synchronously", async () => {
        const { recorder } = harness(() => {
            throw new Error("thrown, not rejected");
        });

        await expect(
            recorder.record({ model: model(), entry: entry(), action: "entry.update" })
        ).resolves.toBeUndefined();
    });

    it("resolves when identity resolution throws", async () => {
        const { recorder } = harness(ok, { identityThrows: true });

        await expect(
            recorder.record({ model: model(), entry: entry(), action: "entry.update" })
        ).resolves.toBeUndefined();
    });

    it("resolves when source resolution throws", async () => {
        const { recorder } = harness(ok, { sourceThrows: true });

        await expect(
            recorder.record({ model: model(), entry: entry(), action: "entry.update" })
        ).resolves.toBeUndefined();
    });

    it("resolves when the model is malformed", async () => {
        const { recorder } = harness(ok);

        await expect(
            recorder.record({
                model: undefined as unknown as CmsModel,
                entry: entry(),
                action: "entry.update"
            })
        ).resolves.toBeUndefined();
    });

    it("resolves when the entry is malformed", async () => {
        const { recorder } = harness(ok);

        await expect(
            recorder.record({
                model: model(),
                entry: undefined as unknown as CmsEntry,
                action: "entry.update"
            })
        ).resolves.toBeUndefined();
    });

    it("resolves when the model fields are not the shape the type claims", async () => {
        const { recorder } = harness(ok);

        await expect(
            recorder.record({
                model: model({ fields: "not a list" as never }),
                entry: entry({ values: { a: 1 } }),
                action: "entry.update",
                original: entry({ values: { a: 2 } })
            })
        ).resolves.toBeUndefined();
    });

    it("reports the failure rather than swallowing it silently", async () => {
        const { recorder } = harness(() => Promise.reject(new Error("network down")));

        await recorder.record({ model: model(), entry: entry(), action: "entry.update" });

        expect(console.error).toHaveBeenCalled();
        expect(vi.mocked(console.error).mock.calls[0]![0]).toContain("activity-log");
    });
});

describe("recorder behaviour", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    it("writes nothing for a private model", async () => {
        // Core features store their own data as entries in private models — tasks, folders, locks,
        // scheduled actions, workflow states, WB pages. Capturing them would bury editorial
        // activity, and would record the activity log's own writes.
        const { recorder, append } = harness(ok);

        await recorder.record({
            model: model({ isPrivate: true }),
            entry: entry(),
            action: "entry.update"
        });

        expect(append).not.toHaveBeenCalled();
    });

    it("takes the actor from the ambient identity, never from the entry", async () => {
        // Every *By meta field is settable through the manage API, so entry.savedBy is
        // client-controlled and cannot be the basis of an audit trail.
        const { recorder, append } = harness(ok);

        await recorder.record({
            model: model(),
            entry: entry({
                savedBy: { id: "attacker", displayName: "Someone Else", type: "admin" } as never
            }),
            action: "entry.update"
        });

        expect(append.mock.calls[0]![0]).toMatchObject({
            actor: { id: "u-1", type: "admin", displayName: "Ada" }
        });
    });

    it("records the revision and the revision-free target id", async () => {
        const { recorder, append } = harness(ok);

        await recorder.record({
            model: model(),
            entry: entry({ id: "abc#0007", entryId: "abc" }),
            action: "entry.update"
        });

        expect(append.mock.calls[0]![0]).toMatchObject({
            targetType: "cms-entry",
            targetId: "abc",
            revision: "abc#0007"
        });
    });

    it("derives the target id from the revision id when entryId is absent", async () => {
        const { recorder, append } = harness(ok);

        await recorder.record({
            model: model(),
            entry: { id: "xyz#0003", values: {} } as CmsEntry,
            action: "entry.update"
        });

        expect(append.mock.calls[0]![0]).toMatchObject({ targetId: "xyz" });
    });

    it("produces an empty changeset when the event carries no original", async () => {
        // A publish, unpublish, move or trashing changes no field values. An absent original
        // means "no changeset", never "everything changed".
        const { recorder, append } = harness(ok);

        await recorder.record({
            model: model({
                fields: [{ fieldId: "title", type: "text", label: "Title", list: false } as never]
            }),
            entry: entry({ values: { title: "anything" } }),
            action: "entry.publish"
        });

        expect(append.mock.calls[0]![0]).toMatchObject({ changeset: [], truncated: false });
    });

    it("diffs against the original when the event carries one", async () => {
        const { recorder, append } = harness(ok);

        await recorder.record({
            model: model({
                fields: [{ fieldId: "title", type: "text", label: "Title", list: false } as never]
            }),
            entry: entry({ values: { title: "after" } }),
            original: entry({ values: { title: "before" } }),
            action: "entry.update"
        });

        expect(append.mock.calls[0]![0]).toMatchObject({
            changeset: [{ path: "title", label: "Title" }]
        });
    });

    it("mints a correlation id when none is supplied", async () => {
        const { recorder, append } = harness(ok);

        await recorder.record({ model: model(), entry: entry(), action: "entry.update" });

        expect(append.mock.calls[0]![0].correlationId).toMatch(/^[a-z0-9]{12}$/);
    });

    it("keeps a supplied correlation id, so a bulk action groups", async () => {
        const { recorder, append } = harness(ok);

        await recorder.record({
            model: model(),
            entry: entry(),
            action: "entry.delete",
            correlationId: "shared123456"
        });

        expect(append.mock.calls[0]![0].correlationId).toBe("shared123456");
    });

    it("always records a source", async () => {
        const { recorder, append } = harness(ok);

        await recorder.record({ model: model(), entry: entry(), action: "entry.update" });

        expect(append.mock.calls[0]![0].source).toBe("admin");
    });
});
