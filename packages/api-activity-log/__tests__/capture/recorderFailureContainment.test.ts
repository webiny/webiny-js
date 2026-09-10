import { beforeEach, describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import { ActivityLogPersistenceError } from "~/core/errors.js";
import {
    ActivitySourceResolver,
    ActivityWriter,
    EntryActivityRecorder
} from "~/cms/recorder/abstractions.js";
import { ActivityWriter as ActivityWriterImpl } from "~/cms/recorder/ActivityWriter.js";
import { EntryActivityRecorder as EntryActivityRecorderImpl } from "~/cms/recorder/EntryActivityRecorder.js";

/**
 * Failure containment is the hardest requirement in the feature, and it lives in exactly one
 * place: `ActivityWriter`. Both recorders sit on top of it, so a second copy of this logic would
 * be a second chance to forget that a synchronous throw is not a rejection.
 *
 * `EventPublisher` awaits handlers sequentially, inline, inside the write. A handler that rejects
 * propagates into the entry write *after* the entry has already been persisted, so the user is
 * shown a failed save of data that is in fact committed. Audit logs has exactly this defect today.
 *
 * Every test in the first block is the same assertion from a different angle: whatever goes wrong,
 * the call resolves.
 */

const model = (overrides: Partial<CmsModel> = {}): CmsModel =>
    ({ modelId: "article", isPrivate: false, fields: [], ...overrides }) as CmsModel;

const entry = (overrides: Partial<CmsEntry> = {}): CmsEntry =>
    ({ id: "abc#0001", entryId: "abc", values: {}, ...overrides }) as CmsEntry;

const writerHarness = (
    appendImpl: (...args: unknown[]) => unknown,
    options: { identityThrows?: boolean; sourceThrows?: boolean } = {}
) => {
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

    container.register(ActivityWriterImpl);

    return { writer: container.resolve(ActivityWriter), append };
};

const recorderHarness = (writeImpl: (...args: unknown[]) => unknown = async () => undefined) => {
    const container = new Container();
    const write = vi.fn(writeImpl);

    container.registerInstance(ActivityWriter, { write } as unknown as ActivityWriter.Interface);
    container.register(EntryActivityRecorderImpl);

    return { recorder: container.resolve(EntryActivityRecorder), write };
};

const written = () => Result.ok({ id: "rec-1" } as never);
const params = { targetId: "abc", revision: "abc#0001", action: "entry.update" } as const;

describe("ActivityWriter containment", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    it("resolves when storage returns a failed Result", async () => {
        const { writer } = writerHarness(() =>
            Result.fail(new ActivityLogPersistenceError(new Error("table gone")))
        );

        await expect(writer.write(params)).resolves.toBeUndefined();
    });

    it("resolves when storage rejects", async () => {
        const { writer } = writerHarness(() => Promise.reject(new Error("network down")));

        await expect(writer.write(params)).resolves.toBeUndefined();
    });

    it("resolves when storage throws synchronously", async () => {
        const { writer } = writerHarness(() => {
            throw new Error("thrown, not rejected");
        });

        await expect(writer.write(params)).resolves.toBeUndefined();
    });

    it("resolves when identity resolution throws", async () => {
        const { writer } = writerHarness(written, { identityThrows: true });

        await expect(writer.write(params)).resolves.toBeUndefined();
    });

    it("resolves when source resolution throws", async () => {
        const { writer } = writerHarness(written, { sourceThrows: true });

        await expect(writer.write(params)).resolves.toBeUndefined();
    });

    it("reports the failure rather than swallowing it silently", async () => {
        const { writer } = writerHarness(() => Promise.reject(new Error("network down")));

        await writer.write(params);

        expect(console.error).toHaveBeenCalled();
        expect(vi.mocked(console.error).mock.calls[0]![0]).toContain("activity-log");
    });
});

describe("ActivityWriter behaviour", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    it("takes the actor from the ambient identity", async () => {
        // Every *By meta field on an entry is settable through the manage API, and a workflow
        // state's savedBy is no better, so neither can underpin an audit trail.
        const { writer, append } = writerHarness(written);

        await writer.write(params);

        expect(append.mock.calls[0]![0]).toMatchObject({
            actor: { id: "u-1", type: "admin", displayName: "Ada" }
        });
    });

    it("always records a source", async () => {
        const { writer, append } = writerHarness(written);

        await writer.write(params);

        expect(append.mock.calls[0]![0].source).toBe("admin");
    });

    it("mints a correlation id when none is supplied", async () => {
        const { writer, append } = writerHarness(written);

        await writer.write(params);

        expect(append.mock.calls[0]![0].correlationId).toMatch(/^[a-z0-9]{12}$/);
    });

    it("keeps a supplied correlation id, so a batch groups", async () => {
        const { writer, append } = writerHarness(written);

        await writer.write({ ...params, correlationId: "shared123456" });

        expect(append.mock.calls[0]![0].correlationId).toBe("shared123456");
    });

    it("omits subject and note presence when they do not apply", async () => {
        const { writer, append } = writerHarness(written);

        await writer.write(params);

        expect(append.mock.calls[0]![0].subject).toBeUndefined();
        expect(append.mock.calls[0]![0].hasNote).toBeUndefined();
    });

    it("passes through a subject and note presence when supplied", async () => {
        const { writer, append } = writerHarness(written);

        await writer.write({
            ...params,
            action: "review.step.approved",
            subject: { id: "s1", label: "Editorial" },
            hasNote: true
        });

        expect(append.mock.calls[0]![0]).toMatchObject({
            subject: { id: "s1", label: "Editorial" },
            hasNote: true
        });
    });
});

describe("EntryActivityRecorder", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    it("resolves when the model is malformed", async () => {
        const { recorder } = recorderHarness();

        await expect(
            recorder.record({
                model: undefined as unknown as CmsModel,
                entry: entry(),
                action: "entry.update"
            })
        ).resolves.toBeUndefined();
    });

    it("resolves when the entry is malformed", async () => {
        const { recorder } = recorderHarness();

        await expect(
            recorder.record({
                model: model(),
                entry: undefined as unknown as CmsEntry,
                action: "entry.update"
            })
        ).resolves.toBeUndefined();
    });

    it("resolves when the model fields are not the shape the type claims", async () => {
        const { recorder } = recorderHarness();

        await expect(
            recorder.record({
                model: model({ fields: "not a list" as never }),
                entry: entry({ values: { a: 1 } }),
                action: "entry.update",
                original: entry({ values: { a: 2 } })
            })
        ).resolves.toBeUndefined();
    });

    it("resolves when the writer itself throws", async () => {
        const { recorder } = recorderHarness(() => {
            throw new Error("boom");
        });

        await expect(
            recorder.record({ model: model(), entry: entry(), action: "entry.update" })
        ).resolves.toBeUndefined();
    });

    it("writes nothing for a private model", async () => {
        const { recorder, write } = recorderHarness();

        await recorder.record({
            model: model({ isPrivate: true }),
            entry: entry(),
            action: "entry.update"
        });

        expect(write).not.toHaveBeenCalled();
    });

    it("records the revision and the revision-free target id", async () => {
        const { recorder, write } = recorderHarness();

        await recorder.record({
            model: model(),
            entry: entry({ id: "abc#0007", entryId: "abc" }),
            action: "entry.update"
        });

        expect(write.mock.calls[0]![0]).toMatchObject({
            targetId: "abc",
            revision: "abc#0007"
        });
    });

    it("derives the target id from the revision id when entryId is absent", async () => {
        const { recorder, write } = recorderHarness();

        await recorder.record({
            model: model(),
            entry: { id: "xyz#0003", values: {} } as CmsEntry,
            action: "entry.update"
        });

        expect(write.mock.calls[0]![0]).toMatchObject({ targetId: "xyz" });
    });

    it("produces an empty changeset when the event carries no original", async () => {
        // A publish, unpublish, move or trashing changes no field values. An absent original
        // means "no changeset", never "everything changed".
        const { recorder, write } = recorderHarness();

        await recorder.record({
            model: model({
                fields: [{ fieldId: "title", type: "text", label: "Title", list: false } as never]
            }),
            entry: entry({ values: { title: "anything" } }),
            action: "entry.publish"
        });

        expect(write.mock.calls[0]![0]).toMatchObject({ changeset: [], truncated: false });
    });

    it("diffs against the original when the event carries one", async () => {
        const { recorder, write } = recorderHarness();

        await recorder.record({
            model: model({
                fields: [{ fieldId: "title", type: "text", label: "Title", list: false } as never]
            }),
            entry: entry({ values: { title: "after" } }),
            original: entry({ values: { title: "before" } }),
            action: "entry.update"
        });

        expect(write.mock.calls[0]![0]).toMatchObject({
            changeset: [{ path: "title", label: "Title" }]
        });
    });
});
