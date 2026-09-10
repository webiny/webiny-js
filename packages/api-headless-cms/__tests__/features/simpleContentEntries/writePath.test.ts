import { beforeEach, describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { AccessControl, CmsContext } from "~/features/shared/abstractions.js";
import { EntryFromStorageTransform, EntryToStorageTransform } from "~/legacy/abstractions.js";
import { GetLatestRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { UpdateEntryStorageOperation } from "~/features/shared/storageOperations/entry/UpdateEntryStorageOperation.js";
import { DeleteEntryStorageOperation } from "~/features/shared/storageOperations/entry/DeleteEntryStorageOperation.js";
import { ValidationFeature } from "~/features/validation/index.js";
import { EntryDataProcessorFeature } from "~/features/contentEntry/entryDataProcessor/feature.js";
import { SimpleEntryDataFactoriesFeature } from "~/features/simpleContentEntries/entryDataFactories/SimpleEntryDataFactoriesFeature.js";
import { GetSimpleEntryFeature } from "~/features/simpleContentEntries/getSimpleEntry/feature.js";
import { UpdateSimpleEntryFeature } from "~/features/simpleContentEntries/updateSimpleEntry/feature.js";
import { UpdateSimpleEntryUseCase } from "~/features/simpleContentEntries/updateSimpleEntry/index.js";
import { DeleteSimpleEntryFeature } from "~/features/simpleContentEntries/deleteSimpleEntry/feature.js";
import { DeleteSimpleEntryUseCase } from "~/features/simpleContentEntries/deleteSimpleEntry/index.js";
import { SIMPLE_MODEL_TAG } from "~/features/simpleContentEntries/constants.js";
import type { CmsModel } from "~/types/index.js";

const createModel = (tags: string[] = [SIMPLE_MODEL_TAG]): CmsModel => {
    return {
        modelId: "simpleModel",
        name: "Simple Model",
        tenant: "root",
        locale: "en-US",
        titleFieldId: "title",
        layout: [["title"]],
        tags,
        fields: [
            {
                id: "titleFieldId",
                fieldId: "title",
                storageId: "text@titleFieldId",
                type: "text",
                label: "Title"
            }
        ]
    } as unknown as CmsModel;
};

const existing = {
    id: "abc123#0001",
    entryId: "abc123",
    tenant: "root",
    modelId: "simpleModel",
    createdOn: "2026-01-01T00:00:00.000Z",
    createdBy: { id: "id-original", displayName: "Original Author", type: "admin" },
    values: { title: "Before" },
    version: 1,
    status: "draft",
    locked: false,
    expiresAt: null
};

describe("simple entries write path", () => {
    let container: Container;
    let getLatestRevision: ReturnType<typeof vi.fn>;
    let updateStorage: ReturnType<typeof vi.fn>;
    let deleteStorage: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        container = new Container();
        ValidationFeature.register(container);
        EntryDataProcessorFeature.register(container);
        SimpleEntryDataFactoriesFeature.register(container);
        GetSimpleEntryFeature.register(container);
        UpdateSimpleEntryFeature.register(container);
        DeleteSimpleEntryFeature.register(container);

        getLatestRevision = vi.fn(async () => ({ ...existing }));
        updateStorage = vi.fn(async () => undefined);
        deleteStorage = vi.fn(async () => undefined);

        container.registerInstance(CmsContext, { container } as unknown as CmsContext.Interface);
        container.registerInstance(AccessControl, {
            canAccessEntry: async () => true
        } as unknown as AccessControl.Interface);
        container.registerInstance(
            EntryFromStorageTransform,
            (async (_m: unknown, entry: unknown) =>
                entry) as unknown as EntryFromStorageTransform.Interface
        );
        container.registerInstance(
            EntryToStorageTransform,
            (async (_m: unknown, entry: unknown) =>
                entry) as unknown as EntryToStorageTransform.Interface
        );
        container.registerInstance(GetLatestRevisionByEntryIdStorageOperation, {
            execute: getLatestRevision
        } as unknown as GetLatestRevisionByEntryIdStorageOperation.Interface);
        container.registerInstance(UpdateEntryStorageOperation, {
            execute: updateStorage
        } as unknown as UpdateEntryStorageOperation.Interface);
        container.registerInstance(DeleteEntryStorageOperation, {
            execute: deleteStorage
        } as unknown as DeleteEntryStorageOperation.Interface);
    });

    describe("updateSimpleEntry", () => {
        it("changes values and nothing else", async () => {
            const result = await container
                .resolve(UpdateSimpleEntryUseCase)
                .execute(createModel(), "abc123#0001", { values: { title: "After" } });

            expect(result.isFail()).toBe(false);
            expect(result.value.values.title).toBe("After");

            // Identity, creation stamp and the pinned four all survive untouched.
            expect(result.value.id).toBe(existing.id);
            expect(result.value.entryId).toBe(existing.entryId);
            expect(result.value.tenant).toBe(existing.tenant);
            expect(result.value.modelId).toBe(existing.modelId);
            expect(result.value.createdOn).toBe(existing.createdOn);
            expect(result.value.createdBy).toEqual(existing.createdBy);
            expect(result.value.version).toBe(1);
            expect(result.value.status).toBe("draft");
            expect(result.value.locked).toBe(false);
            expect(result.value.expiresAt).toBeNull();
        });

        it("adds no meta field on the way through", async () => {
            const result = await container
                .resolve(UpdateSimpleEntryUseCase)
                .execute(createModel(), "abc123#0001", { values: { title: "After" } });

            expect(Object.keys(result.value).sort()).toEqual(Object.keys(existing).sort());
            expect("savedOn" in result.value).toBe(false);
            expect("modifiedOn" in result.value).toBe(false);
        });

        it("returns NotFound and writes nothing when the entry is absent", async () => {
            getLatestRevision.mockResolvedValueOnce(null);

            const result = await container
                .resolve(UpdateSimpleEntryUseCase)
                .execute(createModel(), "missing#0001", { values: { title: "After" } });

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("Cms/SimpleEntry/NotFound");
            expect(updateStorage).not.toHaveBeenCalled();
        });

        it("refuses a model that is not tagged simple", async () => {
            await expect(
                container
                    .resolve(UpdateSimpleEntryUseCase)
                    .execute(createModel([]), "abc123#0001", { values: { title: "After" } })
            ).rejects.toThrow(/is not a simple model/);
            expect(updateStorage).not.toHaveBeenCalled();
        });
    });

    describe("deleteSimpleEntry", () => {
        it("deletes the resolved entry", async () => {
            const result = await container
                .resolve(DeleteSimpleEntryUseCase)
                .execute(createModel(), "abc123#0001");

            expect(result.isFail()).toBe(false);
            expect(deleteStorage).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ entry: expect.objectContaining({ id: "abc123#0001" }) })
            );
        });

        it("returns NotFound and deletes nothing when the entry is absent", async () => {
            getLatestRevision.mockResolvedValueOnce(null);

            const result = await container
                .resolve(DeleteSimpleEntryUseCase)
                .execute(createModel(), "missing#0001");

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("Cms/SimpleEntry/NotFound");
            expect(deleteStorage).not.toHaveBeenCalled();
        });

        it("refuses a model that is not tagged simple", async () => {
            await expect(
                container.resolve(DeleteSimpleEntryUseCase).execute(createModel([]), "abc123#0001")
            ).rejects.toThrow(/is not a simple model/);
            expect(deleteStorage).not.toHaveBeenCalled();
        });
    });

    describe("round trip", () => {
        it("get, update, get, delete, then get returns NotFound", async () => {
            const model = createModel();
            const stored: Record<string, unknown> | null = { ...existing };
            let current: Record<string, unknown> | null = stored;

            getLatestRevision.mockImplementation(async () => current);
            updateStorage.mockImplementation(async (_m: unknown, params: any) => {
                current = { ...params.entry };
                return undefined;
            });
            deleteStorage.mockImplementation(async () => {
                current = null;
                return undefined;
            });

            const updated = await container
                .resolve(UpdateSimpleEntryUseCase)
                .execute(model, "abc123#0001", { values: { title: "Changed" } });
            expect(updated.value.values.title).toBe("Changed");

            const deleted = await container
                .resolve(DeleteSimpleEntryUseCase)
                .execute(model, "abc123#0001");
            expect(deleted.isFail()).toBe(false);

            const after = await container
                .resolve(DeleteSimpleEntryUseCase)
                .execute(model, "abc123#0001");
            expect(after.isFail()).toBe(true);
            expect(after.error.code).toBe("Cms/SimpleEntry/NotFound");
        });
    });
});
