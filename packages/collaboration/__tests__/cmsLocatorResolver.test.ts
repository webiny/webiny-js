import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntry/index.js";
import { GetLatestRevisionByEntryIdIncludingDeletedUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import {
    EntryNotAuthorizedError,
    EntryNotFoundError,
    EntryPersistenceError
} from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import { CollabLocatorResolver } from "~/api/domain/locator/abstractions.js";
import { CmsLocatorResolver } from "~/api/features/cms/CmsLocatorResolver/CmsLocatorResolver.js";
import { formatCmsContentId } from "~/api/utils/cmsContentId.js";

const createModel = (modelId: string, isPrivate: boolean) => {
    return {
        modelId,
        isPrivate,
        titleFieldId: "title",
        fields: [{ id: "title", fieldId: "title", type: "text", storageId: "text@title" }]
    };
};

const ENTRY = { id: "entry-1#0001", entryId: "entry-1", values: { title: "Secret title" } };

interface SetupParams {
    isPrivate?: boolean;
    getEntryResult?: () => Result<any, any>;
    includingDeletedResult?: () => Result<any, any>;
}

const setup = (params: SetupParams = {}) => {
    const container = new Container();

    const getEntry = {
        execute: vi.fn(async () => {
            return params.getEntryResult ? params.getEntryResult() : Result.ok(ENTRY);
        })
    };
    const getLatestRevisionIncludingDeleted = {
        execute: vi.fn(async () => {
            return params.includingDeletedResult
                ? params.includingDeletedResult()
                : Result.ok(ENTRY);
        })
    };

    container.registerInstance(GetModelUseCase, {
        execute: async (modelId: string) =>
            Result.ok(createModel(modelId, params.isPrivate ?? false))
    } as unknown as GetModelUseCase.Interface);
    container.registerInstance(GetEntryUseCase, getEntry as unknown as GetEntryUseCase.Interface);
    container.registerInstance(
        GetLatestRevisionByEntryIdIncludingDeletedUseCase,
        getLatestRevisionIncludingDeleted as unknown as GetLatestRevisionByEntryIdIncludingDeletedUseCase.Interface
    );
    container.register(CmsLocatorResolver);

    return {
        resolver: container.resolve(CollabLocatorResolver),
        getEntry,
        getLatestRevisionIncludingDeleted
    };
};

const resolveEntry = (resolver: CollabLocatorResolver.Interface) => {
    return resolver.resolve({
        contentType: "cms.entry",
        contentId: formatCmsContentId("article", "entry-1"),
        locator: ""
    });
};

describe("CmsLocatorResolver", () => {
    it("authorizes threads on entries of regular models", async () => {
        const { resolver, getEntry } = setup();

        const resolution = await resolveEntry(resolver);

        expect(resolution).toMatchObject({ exists: true, authorized: true });
        // Access is resolved through the (FLP-decorated) GetEntryUseCase, latest revision.
        expect(getEntry.execute).toHaveBeenCalledWith(expect.anything(), {
            where: { entryId: "entry-1", latest: true }
        });
    });

    it("treats entries of private models as missing", async () => {
        const { resolver, getEntry } = setup({ isPrivate: true });

        const resolution = await resolver.resolve({
            contentType: "cms.entry",
            contentId: formatCmsContentId("privateModel", "entry-1"),
            locator: ""
        });

        expect(resolution).toEqual({ exists: false, authorized: false });
        // The private entry is never loaded.
        expect(getEntry.execute).not.toHaveBeenCalled();
    });

    it("denies access when the entry read is not authorized (e.g. folder level permissions)", async () => {
        const { resolver } = setup({
            getEntryResult: () => Result.fail(new EntryNotAuthorizedError())
        });

        const resolution = await resolveEntry(resolver);

        expect(resolution).toEqual({ exists: false, authorized: false });
    });

    it("denies access on any other entry read failure", async () => {
        const { resolver } = setup({
            getEntryResult: () => Result.fail(new EntryPersistenceError(new Error("boom")))
        });

        const resolution = await resolveEntry(resolver);

        expect(resolution).toEqual({ exists: false, authorized: false });
    });

    it("denies access when the gated read hides an entry that still exists", async () => {
        const { resolver } = setup({
            getEntryResult: () => Result.fail(new EntryNotFoundError("entry-1")),
            includingDeletedResult: () => Result.ok({ ...ENTRY, wbyDeleted: true })
        });

        const resolution = await resolveEntry(resolver);

        expect(resolution).toEqual({ exists: false, authorized: false });
    });

    it("denies access when the existence check is not authorized", async () => {
        const { resolver } = setup({
            getEntryResult: () => Result.fail(new EntryNotFoundError("entry-1")),
            includingDeletedResult: () => Result.fail(new EntryNotAuthorizedError())
        });

        const resolution = await resolveEntry(resolver);

        expect(resolution).toEqual({ exists: false, authorized: false });
    });

    it("keeps orphaned threads readable when the entry no longer exists", async () => {
        const { resolver } = setup({
            getEntryResult: () => Result.fail(new EntryNotFoundError("entry-1")),
            includingDeletedResult: () => Result.fail(new EntryNotFoundError("entry-1"))
        });

        const resolution = await resolveEntry(resolver);

        expect(resolution).toEqual({ exists: false, authorized: true });
    });

    it("treats an accessible trashed entry as authorized but missing", async () => {
        const { resolver } = setup({
            getEntryResult: () => Result.ok({ ...ENTRY, wbyDeleted: true })
        });

        const resolution = await resolveEntry(resolver);

        expect(resolution).toEqual({ exists: false, authorized: true });
    });
});
