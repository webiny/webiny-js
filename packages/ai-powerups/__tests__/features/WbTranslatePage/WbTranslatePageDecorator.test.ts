import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { GetDefaultLanguageUseCase } from "@webiny/languages/exports/api/languages.js";
import { TranslatePageUseCase } from "@webiny/api-website-builder/features/pages/TranslatePage/index.js";
import { UpdatePageRepository } from "@webiny/api-website-builder/features/pages/UpdatePage/abstractions.js";
import { GetPageByIdUseCase } from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import {
    ListGlobalComponentsUseCase,
    ListPageGlobalComponentsUseCase,
    SaveGlobalComponentRepository,
    type GlobalComponent
} from "@webiny/api-website-builder/exports/api/website-builder/globals.js";
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
    // No global components: these cases cover the page alone.
    container.registerInstance(ListPageGlobalComponentsUseCase, {
        execute: async () => Result.ok([])
    } as unknown as ListPageGlobalComponentsUseCase.Interface);
    container.registerInstance(ListGlobalComponentsUseCase, {
        execute: async () => Result.ok([])
    } as unknown as ListGlobalComponentsUseCase.Interface);
    container.registerInstance(SaveGlobalComponentRepository, {
        execute: vi.fn()
    } as unknown as SaveGlobalComponentRepository.Interface);
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

const HEADER = "$global:Demo/Header";
const FOOTER = "$global:Demo/Footer";
const LAYOUT_ELEMENT = "layout-hero";

const createGlobal = (name: string, language: string, title: string): GlobalComponent => {
    const id = `$global:${name}`;
    return {
        name,
        language,
        elements: { [id]: { id, component: { name } } },
        bindings: { [id]: { inputs: { title: { id: "b1", type: "text", static: title } } } }
    };
};

const globalsPage = {
    id: "page-de#0001",
    entryId: "page-de",
    properties: { title: "Home", snippet: "", language: "de", sourcePage: undefined },
    elements: { root: { id: "root" }, hero: { id: "hero", parent: { id: "root" } } },
    bindings: {
        root: { inputs: {} },
        hero: { inputs: { heading: { id: "b2", type: "text", static: "Hello" } } },
        // The page's overrides of a global and of a layout element: page data, not elements of the page.
        [HEADER]: { inputs: { title: { id: "b1", type: "text", static: "Welcome" } } },
        [LAYOUT_ELEMENT]: {
            inputs: {
                text: { id: "b3", type: "lexical", static: { html: "<p>Hi</p>", state: "{}" } }
            }
        }
    }
};

class FakeTranslatePage implements TranslatePageUseCase.Interface {
    async execute(): TranslatePageUseCase.Return {
        return Result.ok(structuredClone(globalsPage) as any);
    }
}

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

    describe("global components", () => {
        let sourceGlobals: GlobalComponent[];
        let targetGlobals: GlobalComponent[];

        const ai = { generateText: vi.fn() };
        const listPageGlobalComponents = { execute: vi.fn() };
        const listGlobalComponents = { execute: vi.fn() };
        const saveGlobalComponent = { execute: vi.fn() };
        const updatePage = { execute: vi.fn() };
        const logger = { info: vi.fn(), warn: vi.fn() };

        const translate = () => {
            const container = new Container();
            container.registerInstance(GetDefaultLanguageUseCase, {
                execute: async () => Result.ok({ code: "en" } as any)
            });
            container.registerInstance(GetPageByIdUseCase, {
                execute: vi.fn()
            } as any);
            container.registerInstance(ResolveAiCapabilityUseCase, {
                execute: async () => Result.ok({ model: {}, connection: {}, guidance: "" } as any)
            } as any);
            container.registerInstance(Logger, logger as any);
            container.registerInstance(Ai, ai as any);
            container.registerInstance(LexicalParser, {
                parse: async (html: string) => ({ root: html })
            });
            container.registerInstance(UpdatePageRepository, updatePage as any);
            container.registerInstance(ListPageGlobalComponentsUseCase, listPageGlobalComponents);
            container.registerInstance(ListGlobalComponentsUseCase, listGlobalComponents);
            container.registerInstance(SaveGlobalComponentRepository, saveGlobalComponent);
            container.register(
                TranslatePageUseCase.createImplementation({
                    implementation: FakeTranslatePage,
                    dependencies: []
                })
            );
            container.registerDecorator(WbTranslatePageDecorator);

            return container
                .resolve(TranslatePageUseCase)
                .execute({ pageId: "page-en#0001", languageCode: "de", folderId: "root" });
        };

        beforeEach(() => {
            vi.clearAllMocks();
            // No globals unless a test adds them.
            sourceGlobals = [];
            targetGlobals = [];
            listPageGlobalComponents.execute.mockImplementation(async () =>
                Result.ok(sourceGlobals)
            );
            listGlobalComponents.execute.mockImplementation(async () => Result.ok(targetGlobals));
            saveGlobalComponent.execute.mockImplementation(async (value: GlobalComponent) =>
                Result.ok(value)
            );
            updatePage.execute.mockImplementation(async (_: string, data: any) =>
                Result.ok({ ...globalsPage, ...data })
            );
            // The AI translates every value it is given by prefixing it.
            ai.generateText.mockImplementation(async ({ prompt }: { prompt: string }) => {
                const input = JSON.parse(prompt.slice(prompt.indexOf("{")));
                const prefix = (bindings: Record<string, { type: string; value: string }>) =>
                    Object.fromEntries(
                        Object.entries(bindings).map(([key, binding]) => [
                            key,
                            { ...binding, value: `DE ${binding.value}` }
                        ])
                    );
                const globals = Object.fromEntries(
                    Object.entries<any>(input.globals ?? {}).map(([name, bindings]) => [
                        name,
                        prefix(bindings)
                    ])
                );
                return {
                    text: JSON.stringify({
                        properties: { title: "Startseite" },
                        bindings: prefix(input.bindings),
                        globals
                    })
                };
            });
        });

        it("translates the page's own bindings and its overrides, in one AI call", async () => {
            const result = await translate();
            expect(result.isOk()).toBe(true);

            expect(ai.generateText).toHaveBeenCalledTimes(1);

            const [, updateData] = updatePage.execute.mock.calls[0];
            expect(Object.keys(updateData.bindings).sort()).toEqual(
                [HEADER, LAYOUT_ELEMENT, "hero", "root"].sort()
            );
            expect(updateData.bindings.hero.inputs.heading.static).toBe("DE Hello");
            expect(updateData.bindings[HEADER].inputs.title.static).toBe("DE Welcome");
            expect(updateData.bindings[LAYOUT_ELEMENT].inputs.text.static.html).toBe(
                "DE <p>Hi</p>"
            );
            expect(updateData.properties.title).toBe("Startseite");
        });

        it("creates the target-language records of globals that have none, in the same AI call", async () => {
            sourceGlobals = [
                createGlobal("Demo/Header", "en", "Welcome"),
                createGlobal("Demo/Footer", "en", "Bye")
            ];
            targetGlobals = [createGlobal("Demo/Header", "de", "Willkommen")];

            await translate();

            // The source page's globals, in the source language (with its fallback), against the target language.
            expect(listPageGlobalComponents.execute).toHaveBeenCalledWith({ language: "en" });
            expect(listGlobalComponents.execute).toHaveBeenCalledWith({ language: "de" });
            expect(ai.generateText).toHaveBeenCalledTimes(1);

            // The header already has a German record: it is left as it is.
            expect(saveGlobalComponent.execute).toHaveBeenCalledTimes(1);
            expect(saveGlobalComponent.execute).toHaveBeenCalledWith({
                name: "Demo/Footer",
                language: "de",
                elements: sourceGlobals[1].elements,
                bindings: {
                    [FOOTER]: { inputs: { title: { id: "b1", type: "text", static: "DE Bye" } } }
                }
            });

            // The page keeps its own bindings only: a global's record is never stored in a page.
            const [, updateData] = updatePage.execute.mock.calls[0];
            expect(Object.keys(updateData.bindings)).not.toContain(FOOTER);
        });

        it("still translates the page when the globals can't be listed", async () => {
            listGlobalComponents.execute.mockImplementation(async () =>
                Result.fail(new Error("Storage down") as any)
            );

            const result = await translate();

            expect(result.isOk()).toBe(true);
            expect(saveGlobalComponent.execute).not.toHaveBeenCalled();
            expect(updatePage.execute).toHaveBeenCalledTimes(1);
            expect(logger.warn).toHaveBeenCalled();
        });
    });
});
