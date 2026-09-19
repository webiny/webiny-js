import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { PublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/index.js";
import { UnpublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import { ActivityLogPersistenceError } from "~/core/errors.js";
import type { ActivityRecord } from "~/core/types.js";
import { INTEGRATION_MODEL_ID } from "./testModel.js";
import { useCaptureHandler } from "./useCaptureHandler.js";

/**
 * Capture, end to end, along the path a real editor's entry takes.
 *
 * Every other test of capture in this package runs against a fake: the recorder with a fake writer,
 * the writer with fake storage, the handlers with a fake recorder. All necessary, and none of it
 * proves that saving an entry produces a record — the wiring between the CMS's events and this
 * feature's handlers is the one part a fake cannot exercise, and the part most likely to be wrong.
 *
 * Deliberately thin on assertions per test. Diffing is covered exhaustively by the unit suites; the
 * question here is only whether the event actually arrives and the record actually lands.
 */

const handler = useCaptureHandler();

const unwrap = <T, E>(result: Result<T, E>, what: string): T => {
    if (result.isFail()) {
        throw new Error(`${what} failed: ${String(result.error)}`);
    }

    return result.value;
};

interface CmsUseCases {
    model: CmsModel;
    create(values: Record<string, unknown>): Promise<CmsEntry>;
    update(id: string, values: Record<string, unknown>): Promise<CmsEntry>;
    publish(id: string): Promise<CmsEntry>;
    unpublish(id: string): Promise<CmsEntry>;
    newRevisionFrom(id: string, values: Record<string, unknown>): Promise<CmsEntry>;
    trash(id: string): Promise<void>;
    /** Every record for the entry, newest first. */
    activity(entryId: string): Promise<ActivityRecord[]>;
}

const withCms = <T>(callback: (cms: CmsUseCases) => Promise<T>): Promise<T> =>
    handler.withContainer(async container => {
        const model = unwrap(
            await container.resolve(GetModelUseCase).execute(INTEGRATION_MODEL_ID),
            `resolving model "${INTEGRATION_MODEL_ID}"`
        );

        const storage = container.resolve(ActivityLogStorage);

        return callback({
            model,
            async create(values) {
                return unwrap(
                    await container.resolve(CreateEntryUseCase).execute(model, { values }),
                    "create"
                );
            },
            async update(id, values) {
                return unwrap(
                    await container.resolve(UpdateEntryUseCase).execute(model, id, { values }),
                    "update"
                );
            },
            async publish(id) {
                return unwrap(
                    await container.resolve(PublishEntryUseCase).execute(model, id),
                    "publish"
                );
            },
            async unpublish(id) {
                return unwrap(
                    await container.resolve(UnpublishEntryUseCase).execute(model, id),
                    "unpublish"
                );
            },
            async newRevisionFrom(id, values) {
                return unwrap(
                    await container
                        .resolve(CreateEntryRevisionFromUseCase)
                        .execute(model, id, { values }),
                    "create revision from"
                );
            },
            async trash(id) {
                // There is no MoveToBin use case on the manage path: a non-permanent delete is how
                // trashing is expressed, and `DeleteEntryUseCase` delegates to the bin.
                unwrap(
                    await container
                        .resolve(DeleteEntryUseCase)
                        .execute(model, id, { permanently: false }),
                    "trash"
                );
            },
            async activity(entryId) {
                const listed = await storage.list({
                    target: { type: "cms-entry", id: entryId },
                    limit: 100
                });

                return unwrap(listed, "listing activity").records;
            }
        });
    });

const actionsFor = (records: ActivityRecord[]) => records.map(record => record.action);

const pathsIn = (record: ActivityRecord | undefined) =>
    (record?.changeset ?? []).map(change => change.path);

describe("capture, through a real entry write", () => {
    it("records a create", async () => {
        const records = await withCms(async cms => {
            const entry = await cms.create({ title: "First" });

            return cms.activity(entry.entryId);
        });

        expect(actionsFor(records)).toEqual(["entry.create"]);
    });

    it("records a create exactly once, rather than recording its own record", async () => {
        // Storage appends a record by creating an entry in a private CMS model, so writing a
        // record fires the same after-create event this feature listens to. Without the private
        // model filter in the recorder the request never returns at all — and if the filter were
        // narrowed to something weaker, the symptom here would be extra records rather than a
        // hang. Both failures are caught by the count.
        const records = await withCms(async cms => {
            const entry = await cms.create({ title: "Once" });

            return cms.activity(entry.entryId);
        });

        expect(records).toHaveLength(1);
    });

    it("records a save, naming the field that changed", async () => {
        const record = await withCms(async cms => {
            const entry = await cms.create({ title: "First" });
            await cms.update(entry.id, { title: "Second" });

            const records = await cms.activity(entry.entryId);

            return records.find(r => r.action === "entry.update");
        });

        expect(record).toBeDefined();
        expect(pathsIn(record)).toEqual(["title"]);
    });

    it("records the path and the label, never the value", async () => {
        // The feature's central promise, asserted against a real write rather than a fake.
        const record = await withCms(async cms => {
            const entry = await cms.create({ title: "Public" });
            await cms.update(entry.id, { title: "Board pay rise of twelve percent" });

            const records = await cms.activity(entry.entryId);

            return records.find(r => r.action === "entry.update");
        });

        expect(record!.changeset).toEqual([{ path: "title", label: "Title" }]);
        expect(JSON.stringify(record)).not.toContain("Board pay rise");
        expect(JSON.stringify(record)).not.toContain("Public");
    });

    it("records a nested change at its full path", async () => {
        const record = await withCms(async cms => {
            const entry = await cms.create({ title: "T", author: { name: "Ada" } });
            await cms.update(entry.id, { title: "T", author: { name: "Grace" } });

            const records = await cms.activity(entry.entryId);

            return records.find(r => r.action === "entry.update");
        });

        expect(pathsIn(record)).toEqual(["author.name"]);
    });

    it("records a save that changed nothing with an empty changeset", async () => {
        // An empty changeset is the honest answer, and the reason no stored hash is needed to
        // recognise a no-op save.
        const record = await withCms(async cms => {
            const entry = await cms.create({ title: "Same" });
            await cms.update(entry.id, { title: "Same" });

            const records = await cms.activity(entry.entryId);

            return records.find(r => r.action === "entry.update");
        });

        expect(record).toBeDefined();
        expect(record!.changeset).toEqual([]);
    });

    it("records a publish and an unpublish, neither carrying a changeset", async () => {
        // Neither changes a field value, so an "everything changed" changeset would be a lie.
        const records = await withCms(async cms => {
            const entry = await cms.create({ title: "P" });
            await cms.publish(entry.id);
            await cms.unpublish(entry.id);

            return cms.activity(entry.entryId);
        });

        const publish = records.find(r => r.action === "entry.publish");
        const unpublish = records.find(r => r.action === "entry.unpublish");

        expect(publish).toBeDefined();
        expect(unpublish).toBeDefined();
        expect(publish!.changeset).toEqual([]);
        expect(unpublish!.changeset).toEqual([]);
    });

    it("records a new revision, diffed against the revision it came from", async () => {
        const record = await withCms(async cms => {
            const entry = await cms.create({ title: "One" });
            await cms.publish(entry.id);
            await cms.newRevisionFrom(entry.id, { title: "Two" });

            const records = await cms.activity(entry.entryId);

            return records.find(r => r.action === "entry.revision.create");
        });

        expect(record).toBeDefined();
        expect(pathsIn(record)).toEqual(["title"]);
    });

    it("records trashing as trashing, not as deletion", async () => {
        // Both arrive as the same after-delete event, discriminated only by `permanent`.
        const records = await withCms(async cms => {
            const entry = await cms.create({ title: "D" });
            await cms.trash(entry.id);

            return cms.activity(entry.entryId);
        });

        expect(actionsFor(records)).toContain("entry.trash");
        expect(actionsFor(records)).not.toContain("entry.delete");
    });

    it("spans revisions under one target, and names the revision on each record", async () => {
        // Recording per save is only useful if the timeline follows the entry rather than the
        // revision, while each record still says which revision the change landed on.
        const records = await withCms(async cms => {
            const first = await cms.create({ title: "One" });
            await cms.publish(first.id);
            const second = await cms.newRevisionFrom(first.id, { title: "Two" });
            await cms.update(second.id, { title: "Three" });

            return cms.activity(first.entryId);
        });

        expect(new Set(records.map(r => r.targetId)).size).toBe(1);
        expect(new Set(records.map(r => r.revision)).size).toBe(2);
    });

    it("orders records newest first", async () => {
        const records = await withCms(async cms => {
            const entry = await cms.create({ title: "One" });
            await cms.update(entry.id, { title: "Two" });
            await cms.update(entry.id, { title: "Three" });

            return cms.activity(entry.entryId);
        });

        expect(actionsFor(records)).toEqual(["entry.update", "entry.update", "entry.create"]);
    });

    it("attributes the record to the acting identity and labels the source", async () => {
        const record = await withCms(async cms => {
            const entry = await cms.create({ title: "A" });

            return (await cms.activity(entry.entryId))[0];
        });

        expect(record!.actor).toEqual({
            id: handler.identity.id,
            type: handler.identity.type,
            displayName: handler.identity.displayName
        });
        // No task is running, so the source is the identity's own type — never inferred at read
        // time, which is why it is asserted here rather than left to the read path.
        expect(record!.source).toBe(handler.identity.type);
    });
});

/**
 * The requirement the whole feature turns on.
 *
 * Handlers run inline, sequentially and awaited *inside* the entry write, so anything that escapes
 * a handler fails a save that has already persisted. Both failure shapes are exercised, because
 * they reach `ActivityWriter` through different branches and a rewrite could easily keep one and
 * lose the other.
 *
 * Storage is broken by replacing the method on the resolved instance. It is registered as a
 * singleton and each request builds its own child container, so the substitution reaches the
 * recorder for the rest of the request and cannot leak into another test.
 */
describe("a recorder failure never fails a save", () => {
    const createWithBrokenStorage = (
        breakage: (storage: ActivityLogStorage.Interface) => void,
        title: string
    ): Promise<Result<CmsEntry, unknown>> =>
        handler.withContainer(async container => {
            const model = unwrap(
                await container.resolve(GetModelUseCase).execute(INTEGRATION_MODEL_ID),
                "resolving model"
            );

            breakage(container.resolve(ActivityLogStorage));

            return container.resolve(CreateEntryUseCase).execute(model, { values: { title } });
        });

    it("survives storage that throws", async () => {
        const created = await createWithBrokenStorage(storage => {
            storage.append = () => {
                throw new Error("activity storage is down");
            };
        }, "Survives a throw");

        expect(created.isOk()).toBe(true);
        expect(created.value.values.title).toBe("Survives a throw");
    });

    it("survives storage that fails as a value", async () => {
        // Storage converts its own failures into results rather than throwing, so this is the
        // shape a real outage actually takes.
        const created = await createWithBrokenStorage(storage => {
            storage.append = async () =>
                Result.fail(new ActivityLogPersistenceError(new Error("write rejected")));
        }, "Survives a failure");

        expect(created.isOk()).toBe(true);
        expect(created.value.values.title).toBe("Survives a failure");
    });
});
