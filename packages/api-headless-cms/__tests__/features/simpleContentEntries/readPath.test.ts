import { beforeEach, describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { AccessControl } from "~/features/shared/abstractions.js";
import { EntryFromStorageTransform, SearchableFieldsProvider } from "~/legacy/abstractions.js";
import { GetLatestRevisionByEntryIdStorageOperation } from "~/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { ListEntriesStorageOperation } from "~/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { GetSimpleEntryFeature } from "~/features/simpleContentEntries/getSimpleEntry/feature.js";
import { GetSimpleEntryUseCase } from "~/features/simpleContentEntries/getSimpleEntry/index.js";
import { ListSimpleEntriesFeature } from "~/features/simpleContentEntries/listSimpleEntries/feature.js";
import { ListSimpleEntriesUseCase } from "~/features/simpleContentEntries/listSimpleEntries/index.js";
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

const storedEntry = (entryId: string) => {
    return {
        id: `${entryId}#0001`,
        entryId,
        tenant: "root",
        modelId: "simpleModel",
        createdOn: "2026-09-10T00:00:00.000Z",
        createdBy: { id: "id-1", displayName: "John", type: "admin" },
        values: { title: "Hello" },
        version: 1,
        status: "draft",
        locked: false,
        expiresAt: null
    };
};

describe("simple entries read path", () => {
    let container: Container;
    let getLatestRevision: ReturnType<typeof vi.fn>;
    let listEntries: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        container = new Container();
        GetSimpleEntryFeature.register(container);
        ListSimpleEntriesFeature.register(container);

        getLatestRevision = vi.fn(async () => null);
        listEntries = vi.fn(async () => ({
            items: [],
            hasMoreItems: false,
            totalCount: 0,
            cursor: null
        }));

        container.registerInstance(AccessControl, {
            canAccessEntry: async () => true
        } as unknown as AccessControl.Interface);
        container.registerInstance(
            EntryFromStorageTransform,
            (async (_model: unknown, entry: unknown) =>
                entry) as unknown as EntryFromStorageTransform.Interface
        );
        container.registerInstance(SearchableFieldsProvider, (() => [
            "title"
        ]) as unknown as SearchableFieldsProvider.Interface);
        container.registerInstance(GetLatestRevisionByEntryIdStorageOperation, {
            execute: getLatestRevision
        } as unknown as GetLatestRevisionByEntryIdStorageOperation.Interface);
        container.registerInstance(ListEntriesStorageOperation, {
            execute: listEntries
        } as unknown as ListEntriesStorageOperation.Interface);
    });

    describe("getSimpleEntry", () => {
        it("returns a NotFound result rather than null when the entry is absent", async () => {
            const result = await container
                .resolve(GetSimpleEntryUseCase)
                .execute(createModel(), { where: { entryId: "missing" } });

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("Cms/SimpleEntry/NotFound");
        });

        it("returns the entry when storage has it", async () => {
            getLatestRevision.mockResolvedValueOnce(storedEntry("abc123"));

            const result = await container
                .resolve(GetSimpleEntryUseCase)
                .execute(createModel(), { where: { entryId: "abc123" } });

            expect(result.isFail()).toBe(false);
            expect(result.value.entryId).toBe("abc123");
        });

        it("strips the revision suffix when given a versioned id", async () => {
            getLatestRevision.mockResolvedValueOnce(storedEntry("abc123"));

            await container
                .resolve(GetSimpleEntryUseCase)
                .execute(createModel(), { where: { id: "abc123#0001" } });

            expect(getLatestRevision).toHaveBeenCalledWith(expect.anything(), { id: "abc123" });
        });

        it("fails NotFound when neither id nor entryId is given", async () => {
            const result = await container
                .resolve(GetSimpleEntryUseCase)
                .execute(createModel(), { where: {} });

            expect(result.isFail()).toBe(true);
            expect(getLatestRevision).not.toHaveBeenCalled();
        });

        it("refuses a model that is not tagged simple", async () => {
            await expect(
                container
                    .resolve(GetSimpleEntryUseCase)
                    .execute(createModel([]), { where: { entryId: "abc123" } })
            ).rejects.toThrow(/is not a simple model/);
        });
    });

    describe("listSimpleEntries", () => {
        it("defaults to a createdOn sort and a limit of 50", async () => {
            await container.resolve(ListSimpleEntriesUseCase).execute(createModel());

            expect(listEntries).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ sort: ["createdOn_DESC"], limit: 50 })
            );
        });

        it("passes a caller supplied sort and limit through", async () => {
            await container.resolve(ListSimpleEntriesUseCase).execute(createModel(), {
                sort: ["id_ASC"],
                limit: 5
            });

            expect(listEntries).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ sort: ["id_ASC"], limit: 5 })
            );
        });

        it("nulls the cursor when there are no more items", async () => {
            listEntries.mockResolvedValueOnce({
                items: [storedEntry("a")],
                hasMoreItems: false,
                totalCount: 1,
                cursor: "should-be-dropped"
            });

            const result = await container.resolve(ListSimpleEntriesUseCase).execute(createModel());

            expect(result.value.meta).toEqual({
                hasMoreItems: false,
                totalCount: 1,
                cursor: null
            });
        });

        it("keeps the cursor when more items remain", async () => {
            listEntries.mockResolvedValueOnce({
                items: [storedEntry("a"), storedEntry("b")],
                hasMoreItems: true,
                totalCount: 5,
                cursor: "next-page"
            });

            const result = await container.resolve(ListSimpleEntriesUseCase).execute(createModel());

            expect(result.value.meta.cursor).toBe("next-page");
            expect(result.value.items).toHaveLength(2);
        });

        it("refuses a model that is not tagged simple", async () => {
            await expect(
                container.resolve(ListSimpleEntriesUseCase).execute(createModel([]))
            ).rejects.toThrow(/is not a simple model/);
        });
    });
});
