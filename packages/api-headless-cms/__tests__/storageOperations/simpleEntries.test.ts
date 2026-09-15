import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import type { Container } from "@webiny/di";
import { DeleteModelStorageOperation } from "~/features/shared/storageOperations/model/DeleteModelStorageOperation.js";
import { GetRevisionsStorageOperation } from "~/features/shared/storageOperations/entry/GetRevisionsStorageOperation.js";
import { GetLatestRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { CreateSimpleEntryUseCase } from "~/features/simpleContentEntries/createSimpleEntry/index.js";
import { UpdateSimpleEntryUseCase } from "~/features/simpleContentEntries/updateSimpleEntry/index.js";
import { GetSimpleEntryUseCase } from "~/features/simpleContentEntries/getSimpleEntry/index.js";
import { ListSimpleEntriesUseCase } from "~/features/simpleContentEntries/listSimpleEntries/index.js";
import { DeleteSimpleEntryUseCase } from "~/features/simpleContentEntries/deleteSimpleEntry/index.js";
import { SIMPLE_MODEL_TAG } from "~/features/simpleContentEntries/constants.js";
import { ENTRY_META_FIELDS } from "~/constants.js";
import type { CmsModel } from "~/types/index.js";

vi.setConfig({
    testTimeout: 100_000
});

const titleId = "titlefld";
const noteId = "notefld";

const createSimpleModel = (): CmsModel => {
    return {
        name: "Simple Note",
        singularApiName: "SimpleNote",
        pluralApiName: "SimpleNotes",
        group: {
            id: "group",
            name: "Base group"
        },
        modelId: "simpleNotesModel",
        tenant: "root",
        tags: [SIMPLE_MODEL_TAG],
        titleFieldId: titleId,
        description: "",
        fields: [
            {
                id: titleId,
                storageId: `text@${titleId}`,
                fieldId: "title",
                label: "Title",
                list: false,
                type: "text"
            },
            {
                id: noteId,
                storageId: `text@${noteId}`,
                fieldId: "note",
                label: "Note",
                list: false,
                type: "text"
            }
        ],
        layout: [[titleId], [noteId]]
    } as unknown as CmsModel;
};

/*
 * The 26 meta fields a simple entry drops. createdOn and createdBy are the two it keeps.
 */
const DROPPED_META_FIELDS = ENTRY_META_FIELDS.filter(
    field => field !== "createdOn" && field !== "createdBy"
);

/**
 * The eleven fields ISimpleCmsEntry declares, as they come back out of storage.
 */
const EXPECTED_STORED_FIELDS = [
    "createdBy",
    "createdOn",
    "entryId",
    "expiresAt",
    "id",
    "locked",
    "modelId",
    "status",
    "tenant",
    "values",
    "version"
];

/**
 * Backend-specific extras that are known and accepted. The SQL backend persists isLatest and
 * isPublished as columns - SqlCreateEntry assigns them from `status` before the insert and only
 * then deletes them from the in-memory object - so they come back on read. Both are derived from
 * a field the shape already pins, so they carry no new state.
 */
const KNOWN_BACKEND_EXTRAS = ["isLatest", "isPublished"];

describe("Simple content entries - storage integration", () => {
    const handler = useGraphQLHandler({
        path: "manage"
    });

    let container: Container;

    const cleanup = async () => {
        try {
            await container.resolve(DeleteModelStorageOperation).execute({
                model: createSimpleModel()
            });
        } catch {
            // The model may not exist yet; nothing to clean up.
        }
    };

    beforeEach(async () => {
        await handler.isInstalledQuery();
        container = handler.getContext().container;
        await cleanup();
    });

    afterEach(async () => {
        await cleanup();
    });

    const create = async (values: Record<string, unknown>) => {
        const result = await container
            .resolve(CreateSimpleEntryUseCase)
            .execute(createSimpleModel(), { values });
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    };

    it("writes a single revision and nothing else", async () => {
        const model = createSimpleModel();
        const entry = await create({ title: "First", note: "A note" });

        const revisions = await container
            .resolve(GetRevisionsStorageOperation)
            .execute(model, { id: entry.entryId });

        expect(revisions).toHaveLength(1);
        expect(revisions[0].version).toBe(1);
        expect(revisions[0].id).toBe(`${entry.entryId}#0001`);
    });

    it("is readable as the latest revision", async () => {
        const model = createSimpleModel();
        const entry = await create({ title: "First", note: "A note" });

        const latest = await container
            .resolve(GetLatestRevisionByEntryIdStorageOperation)
            .execute(model, { id: entry.entryId });

        expect(latest).not.toBeNull();
        expect(latest!.entryId).toBe(entry.entryId);
    });

    /*
     * This is the assertion the whole design rests on: the reduced envelope survives a real
     * storage round trip, and no meta field is reintroduced along the way.
     */
    it("stores none of the 26 dropped meta fields", async () => {
        const model = createSimpleModel();
        const entry = await create({ title: "First", note: "A note" });

        const latest = await container
            .resolve(GetLatestRevisionByEntryIdStorageOperation)
            .execute(model, { id: entry.entryId });

        // Guard the precondition, so this cannot pass because nothing was read back.
        expect(latest).not.toBeNull();

        const present = DROPPED_META_FIELDS.filter(field => {
            const value = (latest as unknown as Record<string, unknown>)[field];
            return value !== undefined && value !== null;
        });

        expect(present).toEqual([]);
    });

    /*
     * Pins the persisted field set. If a backend starts writing something else, this fails rather
     * than the divergence going unnoticed - which is how the SQL extras were found in the first
     * place.
     */
    it("stores the declared fields and no unexpected extras", async () => {
        const model = createSimpleModel();
        const entry = await create({ title: "First", note: "A note" });

        const revisions = await container
            .resolve(GetRevisionsStorageOperation)
            .execute(model, { id: entry.entryId });

        expect(revisions).toHaveLength(1);

        const keys = Object.keys(revisions[0]).sort();

        const missing = EXPECTED_STORED_FIELDS.filter(field => !keys.includes(field));
        expect(missing, "declared fields missing from storage").toEqual([]);

        const unexpected = keys.filter(field => {
            return !EXPECTED_STORED_FIELDS.includes(field) && !KNOWN_BACKEND_EXTRAS.includes(field);
        });
        expect(unexpected, "storage wrote fields the shape does not declare").toEqual([]);
    });

    it("keeps the creation stamp and the pinned fields across a round trip", async () => {
        const model = createSimpleModel();
        const created = await create({ title: "First", note: "A note" });

        const result = await container
            .resolve(GetSimpleEntryUseCase)
            .execute(model, { where: { entryId: created.entryId } });

        expect(result.isFail()).toBe(false);
        expect(result.value.createdOn).toBe(created.createdOn);
        expect(result.value.createdBy.id).toBe(created.createdBy.id);
        expect(result.value.version).toBe(1);
        expect(result.value.status).toBe("draft");
        expect(result.value.locked).toBe(false);
        expect(result.value.values.title).toBe("First");
    });

    it("updates in place without creating a second revision", async () => {
        const model = createSimpleModel();
        const created = await create({ title: "First", note: "A note" });

        const updated = await container
            .resolve(UpdateSimpleEntryUseCase)
            .execute(model, created.id, { values: { title: "Second", note: "A note" } });

        expect(updated.isFail()).toBe(false);
        expect(updated.value.values.title).toBe("Second");
        expect(updated.value.createdOn).toBe(created.createdOn);

        const revisions = await container
            .resolve(GetRevisionsStorageOperation)
            .execute(model, { id: created.entryId });

        expect(revisions).toHaveLength(1);
        expect(revisions[0].version).toBe(1);
    });

    /*
     * On a search-backed deployment list is answered by OpenSearch, not DynamoDB, so these two are
     * the only tests here that exercise the search path at all. OpenSearch indexes near-real-time
     * and DdbEsListEntries silently returns an empty page on index_not_found_exception, so a naive
     * assertion could pass while proving nothing - hence the bounded retry.
     */
    const listUntil = async (model: CmsModel, expected: number) => {
        for (let attempt = 0; attempt < 40; attempt++) {
            const result = await container
                .resolve(ListSimpleEntriesUseCase)
                .execute(model, { limit: 10 });
            if (result.isFail()) {
                throw result.error;
            }
            if (result.value.items.length === expected) {
                return result.value;
            }
            await new Promise(resolve => setTimeout(resolve, 250));
        }
        throw new Error(`Timed out waiting for ${expected} listed entries.`);
    };

    it("lists the entries it created", async () => {
        const model = createSimpleModel();
        await create({ title: "One", note: "n" });
        await create({ title: "Two", note: "n" });
        await create({ title: "Three", note: "n" });

        const listed = await listUntil(model, 3);

        expect(listed.items).toHaveLength(3);
        expect(listed.meta.totalCount).toBe(3);
        expect(listed.items.map(item => item.values.title).sort()).toEqual(["One", "Three", "Two"]);
        for (const item of listed.items) {
            expect(item.status).toBe("draft");
            expect(item.locked).toBe(false);
        }
    });

    it("paginates with a cursor", async () => {
        const model = createSimpleModel();
        await create({ title: "One", note: "n" });
        await create({ title: "Two", note: "n" });
        await create({ title: "Three", note: "n" });

        await listUntil(model, 3);

        const first = await container
            .resolve(ListSimpleEntriesUseCase)
            .execute(model, { limit: 2 });
        if (first.isFail()) {
            throw first.error;
        }

        expect(first.value.items).toHaveLength(2);
        expect(first.value.meta.hasMoreItems).toBe(true);
        expect(first.value.meta.cursor).toBeTruthy();

        const second = await container
            .resolve(ListSimpleEntriesUseCase)
            .execute(model, { limit: 2, after: first.value.meta.cursor });
        if (second.isFail()) {
            throw second.error;
        }

        expect(second.value.items).toHaveLength(1);
        expect(second.value.meta.hasMoreItems).toBe(false);

        // No entry appears on both pages.
        const firstIds = first.value.items.map(item => item.id);
        const secondIds = second.value.items.map(item => item.id);
        expect(firstIds.filter(id => secondIds.includes(id))).toEqual([]);
    });

    it("deletes permanently, leaving nothing behind", async () => {
        const model = createSimpleModel();
        const created = await create({ title: "First", note: "A note" });

        const deleted = await container
            .resolve(DeleteSimpleEntryUseCase)
            .execute(model, created.id);
        expect(deleted.isFail()).toBe(false);

        const revisions = await container
            .resolve(GetRevisionsStorageOperation)
            .execute(model, { id: created.entryId });
        expect(revisions).toHaveLength(0);

        const after = await container
            .resolve(GetSimpleEntryUseCase)
            .execute(model, { where: { entryId: created.entryId } });
        expect(after.isFail()).toBe(true);
        expect(after.error.code).toBe("Cms/SimpleEntry/NotFound");
    });
});
