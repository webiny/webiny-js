import { beforeEach, describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { createSimpleContentEntryCrud } from "~/crud/simpleContentEntry.crud.js";
import { AccessControl, CmsContext } from "~/features/shared/abstractions.js";
import { EntryFromStorageTransform, EntryToStorageTransform } from "~/legacy/abstractions.js";
import { SearchableFieldsProvider } from "~/legacy/abstractions.js";
import { GetLatestRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { ListEntriesStorageOperation } from "~/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { CreateEntryStorageOperation } from "~/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
import { UpdateEntryStorageOperation } from "~/features/shared/storageOperations/entry/UpdateEntryStorageOperation.js";
import { DeleteEntryStorageOperation } from "~/features/shared/storageOperations/entry/DeleteEntryStorageOperation.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ValidationFeature } from "~/features/validation/index.js";
import { EntryDataProcessorFeature } from "~/features/contentEntry/entryDataProcessor/feature.js";
import { SimpleContentEntriesFeature } from "~/features/simpleContentEntries/SimpleContentEntriesFeature.js";
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

describe("simple entry CRUD surface", () => {
    let container: Container;
    let crud: ReturnType<typeof createSimpleContentEntryCrud>;
    let stored: Record<string, unknown> | null;

    beforeEach(() => {
        container = new Container();
        ValidationFeature.register(container);
        EntryDataProcessorFeature.register(container);
        SimpleContentEntriesFeature.register(container);

        stored = null;

        container.registerInstance(CmsContext, { container } as unknown as CmsContext.Interface);
        container.registerInstance(AccessControl, {
            canAccessEntry: async () => true
        } as unknown as AccessControl.Interface);
        container.registerInstance(IdentityContext, {
            getIdentity: () => ({ id: "id-1", displayName: "John", type: "admin" })
        } as unknown as IdentityContext.Interface);
        container.registerInstance(TenantContext, {
            getTenant: () => ({ id: "root", name: "Root" })
        } as unknown as TenantContext.Interface);
        container.registerInstance(
            EntryFromStorageTransform,
            (async (_m: unknown, e: unknown) => e) as unknown as EntryFromStorageTransform.Interface
        );
        container.registerInstance(
            EntryToStorageTransform,
            (async (_m: unknown, e: unknown) => e) as unknown as EntryToStorageTransform.Interface
        );
        container.registerInstance(SearchableFieldsProvider, (() => [
            "title"
        ]) as unknown as SearchableFieldsProvider.Interface);
        container.registerInstance(CreateEntryStorageOperation, {
            execute: vi.fn(async (_m: unknown, params: any) => {
                stored = { ...params.entry };
                return params.storageEntry;
            })
        } as unknown as CreateEntryStorageOperation.Interface);
        container.registerInstance(UpdateEntryStorageOperation, {
            execute: vi.fn(async (_m: unknown, params: any) => {
                stored = { ...params.entry };
                return params.storageEntry;
            })
        } as unknown as UpdateEntryStorageOperation.Interface);
        container.registerInstance(DeleteEntryStorageOperation, {
            execute: vi.fn(async () => {
                stored = null;
            })
        } as unknown as DeleteEntryStorageOperation.Interface);
        container.registerInstance(GetLatestRevisionByEntryIdStorageOperation, {
            execute: vi.fn(async () => stored)
        } as unknown as GetLatestRevisionByEntryIdStorageOperation.Interface);
        container.registerInstance(ListEntriesStorageOperation, {
            execute: vi.fn(async () => ({
                items: stored ? [stored] : [],
                hasMoreItems: false,
                totalCount: stored ? 1 : 0,
                cursor: null
            }))
        } as unknown as ListEntriesStorageOperation.Interface);

        crud = createSimpleContentEntryCrud({
            context: { container } as unknown as Parameters<
                typeof createSimpleContentEntryCrud
            >[0]["context"]
        });
    });

    it("exposes exactly the five simple methods", () => {
        expect(Object.keys(crud).sort()).toEqual([
            "simpleCreateEntry",
            "simpleDeleteEntry",
            "simpleGetEntry",
            "simpleListEntries",
            "simpleUpdateEntry"
        ]);
    });

    it("round trips create, get, list, update, delete", async () => {
        const model = createModel();

        const created = await crud.simpleCreateEntry(model, { values: { title: "Hello" } });
        expect(created.values.title).toBe("Hello");

        const fetched = await crud.simpleGetEntry(model, { where: { id: created.id } });
        expect(fetched.entryId).toBe(created.entryId);

        const listed = await crud.simpleListEntries(model);
        expect(listed.items).toHaveLength(1);
        expect(listed.meta.totalCount).toBe(1);

        const updated = await crud.simpleUpdateEntry(model, created.id, {
            values: { title: "Changed" }
        });
        expect(updated.values.title).toBe("Changed");
        expect(updated.createdOn).toBe(created.createdOn);

        await crud.simpleDeleteEntry(model, created.id);

        await expect(
            crud.simpleGetEntry(model, { where: { id: created.id } })
        ).rejects.toMatchObject({ code: "Cms/SimpleEntry/NotFound" });
    });

    it("resolves use cases through the public export surface", async () => {
        // The re-exported abstraction must be the same token the feature registered, otherwise a
        // consumer importing from exports/api/cms/simpleEntry.js resolves nothing.
        const surface = await import("~/exports/api/cms/simpleEntry.js");

        expect(() => container.resolve(surface.CreateSimpleEntryUseCase)).not.toThrow();
        expect(() => container.resolve(surface.GetSimpleEntryUseCase)).not.toThrow();
        expect(() => container.resolve(surface.ListSimpleEntriesUseCase)).not.toThrow();
        expect(() => container.resolve(surface.UpdateSimpleEntryUseCase)).not.toThrow();
        expect(() => container.resolve(surface.DeleteSimpleEntryUseCase)).not.toThrow();
    });

    it("throws rather than returning a failed Result", async () => {
        await expect(
            crud.simpleGetEntry(createModel(), { where: { id: "nope#0001" } })
        ).rejects.toMatchObject({ code: "Cms/SimpleEntry/NotFound" });
    });

    /*
     * The invariant has to survive a hostile record, not just a well behaved one. A simple entry
     * cannot be published or locked, so a stored record claiming otherwise must not be able to
     * propagate that through an update.
     */
    it("normalizes a stored record that broke the invariant", async () => {
        const model = createModel();
        const created = await crud.simpleCreateEntry(model, { values: { title: "Hello" } });

        // Simulate a record that somehow became published and locked in storage.
        Object.assign(stored!, { status: "published", locked: true, version: 3, expiresAt: 99 });

        const updated = await crud.simpleUpdateEntry(model, created.id, {
            values: { title: "Changed" }
        });

        expect(updated.status).toBe("draft");
        expect(updated.locked).toBe(false);
        expect(updated.version).toBe(1);
        expect(updated.expiresAt).toBeNull();

        // And what reached storage is a draft too, not the tampered values.
        expect(stored).toMatchObject({
            status: "draft",
            locked: false,
            version: 1,
            expiresAt: null
        });
    });

    it("cannot persist a published or locked entry through a repository", async () => {
        const model = createModel();
        const { CreateSimpleEntryRepository } =
            await import("~/features/simpleContentEntries/createSimpleEntry/index.js");
        const repository = container.resolve(CreateSimpleEntryRepository);

        const published = {
            id: "x#0001",
            entryId: "x",
            tenant: "root",
            modelId: "simpleModel",
            createdOn: "2026-01-01T00:00:00.000Z",
            createdBy: { id: "id-1", displayName: "John", type: "admin" },
            values: {},
            version: 1,
            status: "published",
            locked: true,
            expiresAt: null
        };

        await expect(repository.execute(model, published as never)).rejects.toMatchObject({
            code: "Cms/SimpleEntry/InvariantViolated"
        });
        expect(stored).toBeNull();
    });

    it("refuses an untagged model on every method that writes", async () => {
        const regular = createModel([]);

        await expect(
            crud.simpleCreateEntry(regular, { values: { title: "Hello" } })
        ).rejects.toThrow(/is not a simple model/);
        await expect(crud.simpleListEntries(regular)).rejects.toThrow(/is not a simple model/);
        await expect(crud.simpleGetEntry(regular, { where: { id: "x#0001" } })).rejects.toThrow(
            /is not a simple model/
        );
    });
});

describe("public export surface", () => {
    /*
     * exports/api/cms/simpleEntry.js is the path other packages import from, the way
     * background-tasks and tenant-manager import exports/api/cms/entry.js. If a re-export path
     * rots this fails here rather than in a consumer.
     */
    it("re-exports the five use cases, the factories and the tag", async () => {
        const surface = await import("~/exports/api/cms/simpleEntry.js");

        expect(surface.SIMPLE_MODEL_TAG).toBe("cms:simple");

        for (const name of [
            "CreateSimpleEntryUseCase",
            "UpdateSimpleEntryUseCase",
            "GetSimpleEntryUseCase",
            "ListSimpleEntriesUseCase",
            "DeleteSimpleEntryUseCase",
            "CreateSimpleEntryDataFactory",
            "UpdateSimpleEntryDataFactory"
        ]) {
            expect(surface[name], `${name} should be exported`).toBeDefined();
        }
    });

    it("re-exports the failure contract", async () => {
        const surface = await import("~/exports/api/cms/simpleEntry.js");

        for (const name of [
            "ModelIsSimpleError",
            "ModelNotSimpleError",
            "SimpleEntryNotAuthorizedError",
            "SimpleEntryNotFoundError",
            "SimpleEntryPersistenceError",
            "SimpleEntryValidationError"
        ]) {
            expect(surface[name], `${name} should be exported`).toBeDefined();
        }
    });

    it("does not leak the repositories", async () => {
        const surface = await import("~/exports/api/cms/simpleEntry.js");

        const leaked = Object.keys(surface).filter(key => key.endsWith("Repository"));
        expect(leaked).toEqual([]);
    });
});
