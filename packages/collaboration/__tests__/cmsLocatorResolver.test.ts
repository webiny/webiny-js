import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
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

const setup = (params: { isPrivate: boolean }) => {
    const container = new Container();

    const getLatestRevision = {
        execute: vi.fn(async () => {
            return Result.ok({ id: "entry-1#0001", values: { title: "Secret title" } });
        })
    };

    container.registerInstance(GetModelUseCase, {
        execute: async (modelId: string) => Result.ok(createModel(modelId, params.isPrivate))
    } as unknown as GetModelUseCase.Interface);
    container.registerInstance(
        GetLatestRevisionByEntryIdUseCase,
        getLatestRevision as unknown as GetLatestRevisionByEntryIdUseCase.Interface
    );
    container.register(CmsLocatorResolver);

    return { resolver: container.resolve(CollabLocatorResolver), getLatestRevision };
};

describe("CmsLocatorResolver", () => {
    it("authorizes threads on entries of regular models", async () => {
        const { resolver } = setup({ isPrivate: false });

        const resolution = await resolver.resolve({
            contentType: "cms.entry",
            contentId: formatCmsContentId("article", "entry-1"),
            locator: ""
        });

        expect(resolution).toMatchObject({ exists: true, authorized: true });
    });

    it("treats entries of private models as missing", async () => {
        const { resolver, getLatestRevision } = setup({ isPrivate: true });

        const resolution = await resolver.resolve({
            contentType: "cms.entry",
            contentId: formatCmsContentId("privateModel", "entry-1"),
            locator: ""
        });

        expect(resolution).toEqual({ exists: false, authorized: false });
        // The private entry is never loaded.
        expect(getLatestRevision.execute).not.toHaveBeenCalled();
    });
});
