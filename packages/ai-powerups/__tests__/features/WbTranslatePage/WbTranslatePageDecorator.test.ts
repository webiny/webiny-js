import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { GetDefaultLanguageUseCase } from "@webiny/languages/exports/api/languages.js";
import { TranslatePageUseCase } from "@webiny/api-website-builder/features/pages/TranslatePage/index.js";
import { UpdatePageRepository } from "@webiny/api-website-builder/features/pages/UpdatePage/abstractions.js";
import { GetPageByIdUseCase } from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/index.js";
import { LexicalParser } from "~/api/features/WbTranslatePage/abstractions/LexicalParser.js";
import { WbTranslatePageDecorator } from "~/api/features/WbTranslatePage/WbTranslatePageDecorator.js";
import { WB_TRANSLATE_PAGE_CAPABILITY } from "~/api/features/WbTranslatePage/capability.js";

const translatedReply = JSON.stringify({
    properties: { title: "Hallo Welt", snippet: "Ein Ausschnitt", pathSlug: "Hallo Welt" },
    bindings: {}
});

interface SetupParams {
    page: Record<string, any>;
    aiText: string;
    sourcePage?: Record<string, any> | null;
}

const setup = ({ page, aiText, sourcePage }: SetupParams) => {
    const container = new Container();
    const prompts: string[] = [];

    const getPageById = {
        execute: vi.fn(async () =>
            sourcePage ? Result.ok(sourcePage) : Result.fail(new Error("Page not found."))
        )
    };
    const updatePage = {
        execute: vi.fn(async (id: string, data: Record<string, any>) =>
            Result.ok({ ...page, id, ...data })
        )
    };

    container.registerInstance(TranslatePageUseCase, {
        execute: async () => Result.ok(page)
    } as unknown as TranslatePageUseCase.Interface);
    container.registerInstance(GetDefaultLanguageUseCase, {
        execute: async () => Result.ok({ code: "en" })
    } as unknown as GetDefaultLanguageUseCase.Interface);
    container.registerInstance(
        GetPageByIdUseCase,
        getPageById as unknown as GetPageByIdUseCase.Interface
    );
    container.registerInstance(ResolveAiCapabilityUseCase, {
        execute: async () =>
            Result.ok({
                capabilityId: WB_TRANSLATE_PAGE_CAPABILITY,
                model: "anthropic/claude-sonnet-4-5",
                connection: { sdkName: "anthropic", apiKey: "sk-test" },
                roleId: "standard",
                fellBackToStandard: false,
                guidance: "Translate.",
                additionalInstructions: undefined
            })
    } as unknown as ResolveAiCapabilityUseCase.Interface);
    container.registerInstance(Logger, {
        info: vi.fn(),
        warn: vi.fn()
    } as unknown as Logger.Interface);
    container.registerInstance(Ai, {
        generateText: async (request: { prompt: string }) => {
            prompts.push(request.prompt);
            return { text: aiText };
        }
    } as unknown as Ai.Interface);
    container.registerInstance(LexicalParser, {
        parse: async () => null
    } as unknown as LexicalParser.Interface);
    container.registerInstance(
        UpdatePageRepository,
        updatePage as unknown as UpdatePageRepository.Interface
    );
    container.registerDecorator(WbTranslatePageDecorator);

    return {
        useCase: container.resolve(TranslatePageUseCase),
        prompts,
        getPageById,
        updatePage
    };
};

const translatedCopy = {
    id: "copy#0001",
    entryId: "copy",
    properties: {
        title: "Hello world",
        snippet: "A snippet",
        language: "de",
        sourcePage: "root-page"
    },
    bindings: {}
};

const params = { pageId: "root-page#0001", languageCode: "de", folderId: "root" };

describe("WbTranslatePageDecorator", () => {
    describe("source language", () => {
        it("reads it from the source page, not from the translated copy", async () => {
            const { useCase, prompts, getPageById } = setup({
                page: translatedCopy,
                aiText: translatedReply,
                sourcePage: { id: "root-page#0001", properties: { language: "fr" } }
            });

            await useCase.execute(params);

            expect(getPageById.execute).toHaveBeenCalledWith("root-page#0001");
            expect(prompts[0]).toContain(`from "fr" to language code "de"`);
        });

        it("falls back to the copy's own language when the source page can't be loaded", async () => {
            const { useCase, prompts } = setup({
                page: translatedCopy,
                aiText: translatedReply,
                sourcePage: null
            });

            await useCase.execute(params);

            expect(prompts[0]).toContain(`from "de" to language code "de"`);
        });
    });

    describe("model output", () => {
        it("applies a translation the model wrapped in a markdown fence", async () => {
            const { useCase, updatePage } = setup({
                page: translatedCopy,
                aiText: "Here is the translation:\n```json\n" + translatedReply + "\n```",
                sourcePage: { id: "root-page#0001", properties: { language: "en" } }
            });

            const result = await useCase.execute(params);

            expect(updatePage.execute).toHaveBeenCalledTimes(1);
            expect(result.value.properties.title).toBe("Hallo Welt");
            expect(result.value.properties.path).toBe("/de/hallo-welt");
        });

        it("leaves the page untranslated when the reply isn't JSON", async () => {
            const { useCase, updatePage } = setup({
                page: translatedCopy,
                aiText: "Sorry, I can't help with that.",
                sourcePage: { id: "root-page#0001", properties: { language: "en" } }
            });

            const result = await useCase.execute(params);

            expect(updatePage.execute).not.toHaveBeenCalled();
            expect(result.value.properties.title).toBe("Hello world");
        });
    });
});
