/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import type { CmsContentEntry, CmsContentEntryRevision, CmsModel } from "~/types.js";
import { CmsModelContext } from "~/features/contentEntry/abstractions.js";
import { CmsModelContext as CmsModelContextImpl } from "~/features/contentEntry/CmsModelContext.js";
import { ListRevisionsUseCase } from "~/features/contentEntry/listRevisions/abstractions.js";
import { CreateRevisionFromUseCase } from "~/features/contentEntry/createRevisionFrom/abstractions.js";
import { DeleteEntryRevisionUseCase } from "~/features/contentEntry/deleteEntryRevision/abstractions.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { RevisionsListPresenter as Abstraction } from "./abstractions.js";
import { RevisionsListPresenter } from "./RevisionsListPresenter.js";

const MODEL: CmsModel = {
    modelId: "testModel",
    name: "Test Model",
    singularApiName: "TestModel",
    pluralApiName: "TestModels",
    fields: [],
    layout: [],
    group: "group-1",
    titleFieldId: "title",
    descriptionFieldId: null,
    imageFieldId: null,
    tags: [],
    savedOn: ""
} as unknown as CmsModel;

function createRevisionDto(
    entryId: string,
    version: number,
    status: "draft" | "published" | "unpublished" = "draft"
): CmsContentEntryRevision {
    return {
        id: `${entryId}#${String(version).padStart(4, "0")}`,
        modelId: MODEL.modelId,
        savedOn: "2024-01-01T00:00:00Z",
        deletedOn: null,
        firstPublishedOn: null,
        lastPublishedOn: null,
        createdBy: { id: "user-1", displayName: "Test User", type: "admin" },
        deletedBy: null,
        revisionCreatedOn: "2024-01-01T00:00:00Z",
        revisionSavedOn: "2024-01-01T00:00:00Z",
        revisionModifiedOn: null,
        revisionDeletedOn: null,
        revisionFirstPublishedOn: null,
        revisionLastPublishedOn: null,
        revisionCreatedBy: { id: "user-1", displayName: "Test User", type: "admin" },
        revisionSavedBy: { id: "user-1", displayName: "Test User", type: "admin" },
        revisionModifiedBy: null,
        revisionDeletedBy: null,
        revisionFirstPublishedBy: null,
        revisionLastPublishedBy: null,
        wbyAco_location: { folderId: "root" },
        meta: {
            title: `Revision ${version}`,
            locked: status !== "draft",
            status,
            version
        }
    } as unknown as CmsContentEntryRevision;
}

function createEntryDto(entryId: string, version: number): CmsContentEntry {
    return {
        id: `${entryId}#${String(version).padStart(4, "0")}`,
        entryId,
        meta: { title: `Entry v${version}`, status: "draft", version, locked: false },
        values: {},
        createdBy: { id: "user-1", displayName: "Test User", type: "admin" },
        createdOn: "2024-01-01T00:00:00Z",
        savedOn: "2024-01-01T00:00:00Z"
    } as unknown as CmsContentEntry;
}

interface TestSetup {
    presenter: Abstraction.Interface;
    listRevisions: { execute: ReturnType<typeof vi.fn> };
    createRevisionFrom: { execute: ReturnType<typeof vi.fn> };
    deleteEntryRevision: { execute: ReturnType<typeof vi.fn> };
    confirmation: { confirm: ReturnType<typeof vi.fn> };
}

function setup(): TestSetup {
    const container = new Container();

    container.register(CmsModelContextImpl).inSingletonScope();
    container.resolve(CmsModelContext).setModel(MODEL);

    const listRevisions = { execute: vi.fn() };
    const createRevisionFrom = { execute: vi.fn() };
    const deleteEntryRevision = { execute: vi.fn() };
    const confirmation = { confirm: vi.fn() };

    container.registerInstance(ListRevisionsUseCase, listRevisions);
    container.registerInstance(CreateRevisionFromUseCase, createRevisionFrom);
    container.registerInstance(DeleteEntryRevisionUseCase, deleteEntryRevision);
    container.registerInstance(Confirmation, confirmation as unknown as Confirmation.Interface);

    container.register(RevisionsListPresenter).inSingletonScope();
    const presenter = container.resolve(Abstraction);

    return { presenter, listRevisions, createRevisionFrom, deleteEntryRevision, confirmation };
}

describe("RevisionsListPresenter", () => {
    let ctx: TestSetup;

    beforeEach(() => {
        ctx = setup();
    });

    describe("init", () => {
        it("should load revisions and set them on the vm", async () => {
            const revisions = [createRevisionDto("abc", 2), createRevisionDto("abc", 1)];
            ctx.listRevisions.execute.mockResolvedValue(revisions);

            await ctx.presenter.init("abc");

            expect(ctx.listRevisions.execute).toHaveBeenCalledWith({
                model: MODEL,
                entryId: "abc"
            });
            expect(ctx.presenter.vm.revisions).toEqual(revisions);
            expect(ctx.presenter.vm.loading).toBe(false);
        });

        it("should handle errors silently", async () => {
            ctx.listRevisions.execute.mockRejectedValue(new Error("Network error"));

            await ctx.presenter.init("abc");

            expect(ctx.presenter.vm.revisions).toEqual([]);
            expect(ctx.presenter.vm.loading).toBe(false);
        });
    });

    describe("createRevision", () => {
        it("should refresh the revisions list after creating a revision", async () => {
            const initialRevisions = [createRevisionDto("abc", 1)];
            const updatedRevisions = [createRevisionDto("abc", 2), createRevisionDto("abc", 1)];
            const newEntry = createEntryDto("abc", 2);

            ctx.listRevisions.execute
                .mockResolvedValueOnce(initialRevisions)
                .mockResolvedValueOnce(updatedRevisions);
            ctx.createRevisionFrom.execute.mockResolvedValue(newEntry);

            await ctx.presenter.init("abc");
            expect(ctx.presenter.vm.revisions).toHaveLength(1);

            const result = await ctx.presenter.createRevision("abc#0001");

            expect(result).toEqual(newEntry);
            expect(ctx.listRevisions.execute).toHaveBeenCalledTimes(2);
            expect(ctx.presenter.vm.revisions).toHaveLength(2);
            expect(ctx.presenter.vm.revisions).toEqual(updatedRevisions);
        });

        it("should not refresh on failure", async () => {
            const initialRevisions = [createRevisionDto("abc", 1)];
            ctx.listRevisions.execute.mockResolvedValue(initialRevisions);
            ctx.createRevisionFrom.execute.mockRejectedValue(new Error("fail"));

            await ctx.presenter.init("abc");

            const result = await ctx.presenter.createRevision("abc#0001");

            expect(result).toBeNull();
            expect(ctx.listRevisions.execute).toHaveBeenCalledTimes(1);
            expect(ctx.presenter.vm.revisions).toHaveLength(1);
        });
    });

    describe("deleteRevision", () => {
        it("should refresh the revisions list after deleting a revision", async () => {
            const initialRevisions = [createRevisionDto("abc", 2), createRevisionDto("abc", 1)];
            const updatedRevisions = [createRevisionDto("abc", 1)];

            ctx.listRevisions.execute
                .mockResolvedValueOnce(initialRevisions)
                .mockResolvedValueOnce(updatedRevisions);
            // The real dialog resolves with undefined (onConfirm is called with no data).
            ctx.confirmation.confirm.mockResolvedValue(undefined);
            ctx.deleteEntryRevision.execute.mockResolvedValue(true);

            await ctx.presenter.init("abc");
            expect(ctx.presenter.vm.revisions).toHaveLength(2);

            const deleted = await ctx.presenter.deleteRevision("abc#0002");

            expect(deleted).toBe(true);
            expect(ctx.listRevisions.execute).toHaveBeenCalledTimes(2);
            expect(ctx.presenter.vm.revisions).toHaveLength(1);
            expect(ctx.presenter.vm.revisions).toEqual(updatedRevisions);
        });

        it("should not refresh when confirmation is declined", async () => {
            const initialRevisions = [createRevisionDto("abc", 2), createRevisionDto("abc", 1)];
            ctx.listRevisions.execute.mockResolvedValue(initialRevisions);
            ctx.confirmation.confirm.mockResolvedValue(false);

            await ctx.presenter.init("abc");

            const deleted = await ctx.presenter.deleteRevision("abc#0002");

            expect(deleted).toBe(false);
            expect(ctx.listRevisions.execute).toHaveBeenCalledTimes(1);
            expect(ctx.deleteEntryRevision.execute).not.toHaveBeenCalled();
        });

        it("should not refresh on failure", async () => {
            const initialRevisions = [createRevisionDto("abc", 2), createRevisionDto("abc", 1)];
            ctx.listRevisions.execute.mockResolvedValue(initialRevisions);
            ctx.confirmation.confirm.mockResolvedValue(undefined);
            ctx.deleteEntryRevision.execute.mockRejectedValue(new Error("fail"));

            await ctx.presenter.init("abc");

            const deleted = await ctx.presenter.deleteRevision("abc#0002");

            expect(deleted).toBe(false);
            expect(ctx.listRevisions.execute).toHaveBeenCalledTimes(1);
        });
    });

    describe("dispose", () => {
        it("should clear all state", async () => {
            const revisions = [createRevisionDto("abc", 1)];
            ctx.listRevisions.execute.mockResolvedValue(revisions);

            await ctx.presenter.init("abc");
            ctx.presenter.show();
            expect(ctx.presenter.vm.visible).toBe(true);
            expect(ctx.presenter.vm.revisions).toHaveLength(1);

            ctx.presenter.dispose();

            expect(ctx.presenter.vm.revisions).toEqual([]);
            expect(ctx.presenter.vm.visible).toBe(false);
            expect(ctx.presenter.vm.loading).toBe(false);
        });
    });
});
