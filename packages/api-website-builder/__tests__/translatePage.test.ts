import { beforeEach, describe, expect, it } from "vitest";
import { useHandler } from "./utils/useHandler.js";
import { pageMocks } from "./mocks/page.mock.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { CreatePageUseCase } from "~/features/pages/CreatePage/index.js";
import { GetPageByIdUseCase } from "~/features/pages/GetPageById/index.js";
import { TranslatePageUseCase } from "~/features/pages/TranslatePage/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/abstractions.js";

const LANGUAGE_MODEL_ID = "wbyLanguage";

describe("TranslatePageUseCase", () => {
    let context: ApiCoreContext;

    const createLanguage = async (values: { name: string; code: string }) => {
        const getModel = context.container.resolve(GetModelUseCase);
        const createEntry = context.container.resolve(CreateEntryUseCase);

        const modelResult = await getModel.execute(LANGUAGE_MODEL_ID);
        if (modelResult.isFail()) {
            throw modelResult.error;
        }

        const result = await createEntry.execute(modelResult.value, {
            values: {
                name: values.name,
                code: values.code,
                direction: "ltr",
                isDefault: false,
                enabled: true
            }
        });

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    };

    beforeEach(async () => {
        const handler = useHandler({});
        context = await handler.handler();
    });

    it("should translate a base page", async () => {
        await createLanguage({ name: "German", code: "de" });

        const createPage = context.container.resolve(CreatePageUseCase);
        const createResult = await createPage.execute(pageMocks.pageA);
        if (createResult.isFail()) {
            throw createResult.error;
        }
        const page = createResult.value;

        const translatePage = context.container.resolve(TranslatePageUseCase);
        const result = await translatePage.execute({
            pageId: page.id,
            languageCode: "de",
            folderId: "de-folder"
        });

        if (result.isFail()) {
            throw result.error;
        }

        const translated = result.value;

        expect(translated.properties.language).toBe("de");
        expect(translated.properties.sourcePage).toBe(page.entryId);
        expect(translated.properties.path).toBe("/de/page-a");
        expect(translated.location.folderId).toBe("de-folder");
        expect(translated.id).not.toBe(page.id);
        expect(translated.entryId).not.toBe(page.entryId);
    });

    it("should translate an already-translated page and resolve lineage to the root base page", async () => {
        await createLanguage({ name: "German", code: "de" });
        await createLanguage({ name: "French", code: "fr" });

        const createPage = context.container.resolve(CreatePageUseCase);
        const createResult = await createPage.execute(pageMocks.pageA);
        if (createResult.isFail()) {
            throw createResult.error;
        }
        const basePage = createResult.value;

        const translatePage = context.container.resolve(TranslatePageUseCase);

        // Translate base -> German.
        const deResult = await translatePage.execute({
            pageId: basePage.id,
            languageCode: "de",
            folderId: "de-folder"
        });
        if (deResult.isFail()) {
            throw deResult.error;
        }
        const dePage = deResult.value;

        // Translate German -> French (chain).
        const frResult = await translatePage.execute({
            pageId: dePage.id,
            languageCode: "fr",
            folderId: "fr-folder"
        });
        if (frResult.isFail()) {
            throw frResult.error;
        }
        const frPage = frResult.value;

        // sourcePage should still point to the original base page.
        expect(frPage.properties.sourcePage).toBe(basePage.entryId);
        expect(frPage.properties.language).toBe("fr");
        // PagePath should replace the existing language code.
        expect(frPage.properties.path).toBe("/fr/page-a");
        expect(frPage.location.folderId).toBe("fr-folder");
    });

    it("should handle root path '/' correctly", async () => {
        await createLanguage({ name: "German", code: "de" });

        const createPage = context.container.resolve(CreatePageUseCase);
        const createResult = await createPage.execute({
            ...pageMocks.pageA,
            properties: { title: "Homepage", path: "/" }
        });
        if (createResult.isFail()) {
            throw createResult.error;
        }
        const page = createResult.value;

        const translatePage = context.container.resolve(TranslatePageUseCase);
        const result = await translatePage.execute({
            pageId: page.id,
            languageCode: "de",
            folderId: "de-folder"
        });
        if (result.isFail()) {
            throw result.error;
        }

        expect(result.value.properties.path).toBe("/de");
    });

    it("should return an error for an invalid language code", async () => {
        const createPage = context.container.resolve(CreatePageUseCase);
        const createResult = await createPage.execute(pageMocks.pageA);
        if (createResult.isFail()) {
            throw createResult.error;
        }
        const page = createResult.value;

        const translatePage = context.container.resolve(TranslatePageUseCase);
        const result = await translatePage.execute({
            pageId: page.id,
            languageCode: "xx",
            folderId: "some-folder"
        });

        expect(result.isFail()).toBeTrue();
        expect(result.error.code).toBe("WebsiteBuilder/Page/TranslationError");
    });

    it("should produce a full copy that can be fetched by ID", async () => {
        await createLanguage({ name: "German", code: "de" });

        const createPage = context.container.resolve(CreatePageUseCase);
        const createResult = await createPage.execute(pageMocks.pageA);
        if (createResult.isFail()) {
            throw createResult.error;
        }
        const page = createResult.value;

        const translatePage = context.container.resolve(TranslatePageUseCase);
        const result = await translatePage.execute({
            pageId: page.id,
            languageCode: "de",
            folderId: "de-folder"
        });
        if (result.isFail()) {
            throw result.error;
        }
        const translated = result.value;

        const getPageById = context.container.resolve(GetPageByIdUseCase);
        const getResult = await getPageById.execute(translated.id);
        if (getResult.isFail()) {
            throw getResult.error;
        }

        const fetched = getResult.value;
        expect(fetched.id).toBe(translated.id);
        expect(fetched.properties.language).toBe("de");
        expect(fetched.properties.sourcePage).toBe(page.entryId);
        expect(fetched.properties.path).toBe("/de/page-a");
        expect(fetched.location.folderId).toBe("de-folder");
    });
});
