import { describe, it, expect, beforeEach, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { GetDefaultLanguageUseCase } from "@webiny/languages/exports/api/languages.js";
import {
    GetLayoutUseCase,
    TranslateLayoutUseCase,
    UpdateLayoutRepository
} from "@webiny/api-website-builder/exports/api/website-builder/layouts.js";
import {
    ListGlobalComponentsUseCase,
    SaveGlobalComponentRepository,
    type GlobalComponent
} from "@webiny/api-website-builder/exports/api/website-builder/globals.js";
import { AiCapabilityDisabledError } from "~/api/features/Capabilities/index.js";
import { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/index.js";
import { LexicalParser } from "~/api/features/WbTranslatePage/abstractions/LexicalParser.js";
import { WbTranslateLayoutDecorator } from "~/api/features/WbTranslatePage/WbTranslateLayoutDecorator.js";

const HEADER = "$global:Demo/Header";
const FOOTER = "$global:Demo/Footer";

const createGlobal = (name: string, language: string, title?: string): GlobalComponent => {
    const id = `$global:${name}`;
    return {
        name,
        language,
        elements: { [id]: { id, component: { name } } },
        bindings: {
            [id]: {
                inputs:
                    title === undefined ? {} : { title: { id: "b1", type: "text", static: title } }
            }
        }
    };
};

const createLayout = () => ({
    id: "layout-de#0001",
    entryId: "layout-de",
    status: "draft",
    version: 1,
    locked: false,
    properties: { title: "Main", language: "de", sourceLayout: "layout" },
    metadata: {},
    elements: {
        root: { id: "root", component: { name: "Webiny/Root" } },
        // Placements of globals: random ids, the global's name as the component name.
        p1: { id: "p1", component: { name: "Demo/Header" }, parent: { id: "root" } },
        p2: { id: "p2", component: { name: "Demo/Footer" }, parent: { id: "root" } },
        text: { id: "text", component: { name: "Webiny/Text" }, parent: { id: "root" } }
    },
    bindings: {
        root: { inputs: {} },
        text: { inputs: { text: { id: "b2", type: "text", static: "Hello" } } },
        // The layout's override of a global.
        [HEADER]: { inputs: { subtitle: { id: "b3", type: "longText", static: "Read on" } } }
    },
    extensions: {}
});

describe("WbTranslateLayoutDecorator", () => {
    let layout: ReturnType<typeof createLayout>;
    let records: GlobalComponent[];
    let sourceLanguage: string | undefined;
    let capabilityEnabled: boolean;

    const ai = { generateText: vi.fn() };
    const listGlobalComponents = { execute: vi.fn() };
    const saveGlobalComponent = { execute: vi.fn() };
    const updateLayout = { execute: vi.fn() };
    const getLayout = { execute: vi.fn() };
    const logger = { info: vi.fn(), warn: vi.fn() };
    const decoratee = { execute: vi.fn() };

    const translate = () => {
        const container = new Container();
        container.registerInstance(GetDefaultLanguageUseCase, {
            execute: async () => Result.ok({ code: "en" } as any)
        });
        container.registerInstance(ResolveAiCapabilityUseCase, {
            execute: async () =>
                capabilityEnabled
                    ? Result.ok({ model: {}, connection: {}, guidance: "" } as any)
                    : Result.fail(
                          new AiCapabilityDisabledError(
                              "wbTranslatePage",
                              "Page translation",
                              ""
                          ) as any
                      )
        } as any);
        container.registerInstance(Logger, logger as any);
        container.registerInstance(Ai, ai as any);
        container.registerInstance(LexicalParser, { parse: async () => null });
        container.registerInstance(GetLayoutUseCase, getLayout as any);
        container.registerInstance(UpdateLayoutRepository, updateLayout as any);
        container.registerInstance(ListGlobalComponentsUseCase, listGlobalComponents);
        container.registerInstance(SaveGlobalComponentRepository, saveGlobalComponent);
        container.registerInstance(TranslateLayoutUseCase, decoratee);
        container.registerDecorator(WbTranslateLayoutDecorator);

        return container.resolve(TranslateLayoutUseCase).execute({ id: "layout", language: "de" });
    };

    // The AI translates every value it is given by prefixing it.
    const translatesEverything = () => {
        const prefix = (bindings: Record<string, { type: string; value: string }> = {}) =>
            Object.fromEntries(
                Object.entries(bindings).map(([key, binding]) => [
                    key,
                    { ...binding, value: `DE ${binding.value}` }
                ])
            );
        ai.generateText.mockImplementation(async ({ prompt }: { prompt: string }) => {
            const input = JSON.parse(prompt.slice(prompt.indexOf("{")));
            const globals = Object.fromEntries(
                Object.entries<any>(input.globals).map(([name, bindings]) => [
                    name,
                    prefix(bindings)
                ])
            );
            return { text: JSON.stringify({ bindings: prefix(input.bindings), globals }) };
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();
        layout = createLayout();
        sourceLanguage = "en";
        capabilityEnabled = true;
        records = [
            createGlobal("Demo/Header", "en", "Welcome"),
            createGlobal("Demo/Footer", "default", "Bye")
        ];

        decoratee.execute.mockImplementation(async () => Result.ok(structuredClone(layout)));
        getLayout.execute.mockImplementation(async () =>
            Result.ok({
                ...createLayout(),
                properties: { title: "Main", language: sourceLanguage }
            })
        );
        listGlobalComponents.execute.mockImplementation(async ({ language }) =>
            Result.ok(records.filter(record => record.language === language))
        );
        saveGlobalComponent.execute.mockImplementation(async (value: GlobalComponent) =>
            Result.ok(value)
        );
        updateLayout.execute.mockImplementation(async (id: string, data: any) =>
            Result.ok({ ...layout, ...data, id })
        );
        translatesEverything();
    });

    it("translates the layout and creates the placed globals missing in the target language", async () => {
        const result = await translate();
        expect(result.isOk()).toBe(true);

        // One AI call for the layout and the missing globals, from the source layout's language.
        expect(ai.generateText).toHaveBeenCalledTimes(1);
        expect(ai.generateText.mock.calls[0][0].prompt).toContain('from "en"');

        // Header comes from its source-language record, Footer from its "default" one.
        expect(saveGlobalComponent.execute).toHaveBeenCalledTimes(2);
        expect(saveGlobalComponent.execute).toHaveBeenCalledWith({
            name: "Demo/Header",
            language: "de",
            elements: records[0].elements,
            bindings: {
                [HEADER]: { inputs: { title: { id: "b1", type: "text", static: "DE Welcome" } } }
            }
        });
        expect(saveGlobalComponent.execute).toHaveBeenCalledWith({
            name: "Demo/Footer",
            language: "de",
            elements: records[1].elements,
            bindings: {
                [FOOTER]: { inputs: { title: { id: "b1", type: "text", static: "DE Bye" } } }
            }
        });

        // The new version's own bindings, including its override of a global, saved via the repository.
        expect(updateLayout.execute).toHaveBeenCalledTimes(1);
        const [id, data] = updateLayout.execute.mock.calls[0];
        expect(id).toBe("layout-de#0001");
        expect(data.properties).toEqual(layout.properties);
        expect(data.elements).toEqual(layout.elements);
        expect(data.bindings.text.inputs.text.static).toBe("DE Hello");
        expect(data.bindings[HEADER].inputs.subtitle.static).toBe("DE Read on");

        expect(result.isOk() && result.value.bindings.text.inputs.text.static).toBe("DE Hello");
    });

    it("leaves a global that already has a record in the target language untouched", async () => {
        records.push(createGlobal("Demo/Header", "de", "Willkommen"));

        await translate();

        const input = JSON.parse(
            ai.generateText.mock.calls[0][0].prompt.slice(
                ai.generateText.mock.calls[0][0].prompt.indexOf("{")
            )
        );
        expect(Object.keys(input.globals)).toEqual(["Demo/Footer"]);

        expect(saveGlobalComponent.execute).toHaveBeenCalledTimes(1);
        expect(saveGlobalComponent.execute.mock.calls[0][0].name).toBe("Demo/Footer");
    });

    it("uses the default records when the source layout has no language", async () => {
        sourceLanguage = undefined;
        records = [
            createGlobal("Demo/Header", "en", "Welcome"),
            createGlobal("Demo/Header", "default", "Hi")
        ];

        await translate();

        expect(listGlobalComponents.execute).not.toHaveBeenCalledWith({ language: "en" });
        // The prompt names the site's default language instead.
        expect(ai.generateText.mock.calls[0][0].prompt).toContain('from "en"');
        expect(saveGlobalComponent.execute).toHaveBeenCalledTimes(1);
        expect(
            saveGlobalComponent.execute.mock.calls[0][0].bindings[HEADER].inputs.title.static
        ).toBe("DE Hi");
    });

    it("doesn't call the AI when nothing is missing and the layout has no text", async () => {
        records = [
            createGlobal("Demo/Header", "de", "Willkommen"),
            createGlobal("Demo/Footer", "de", "Tschüss")
        ];
        layout.bindings = { root: { inputs: {} } } as any;

        const result = await translate();

        expect(result.isOk()).toBe(true);
        expect(ai.generateText).not.toHaveBeenCalled();
        expect(saveGlobalComponent.execute).not.toHaveBeenCalled();
        expect(updateLayout.execute).not.toHaveBeenCalled();
    });

    it("skips placed components that have no stored record", async () => {
        records = [];

        await translate();

        const input = JSON.parse(
            ai.generateText.mock.calls[0][0].prompt.slice(
                ai.generateText.mock.calls[0][0].prompt.indexOf("{")
            )
        );
        expect(input.globals).toEqual({});
        expect(saveGlobalComponent.execute).not.toHaveBeenCalled();
        expect(updateLayout.execute).toHaveBeenCalledTimes(1);
    });

    it("does nothing when page translation is switched off", async () => {
        capabilityEnabled = false;

        const result = await translate();

        expect(result.isOk()).toBe(true);
        expect(ai.generateText).not.toHaveBeenCalled();
        expect(saveGlobalComponent.execute).not.toHaveBeenCalled();
        expect(updateLayout.execute).not.toHaveBeenCalled();
    });

    it("keeps the created version when the translation fails", async () => {
        ai.generateText.mockImplementation(async () => {
            throw new Error("Provider down");
        });

        const result = await translate();

        expect(result.isOk()).toBe(true);
        expect(result.isOk() && result.value.id).toBe("layout-de#0001");
        expect(saveGlobalComponent.execute).not.toHaveBeenCalled();
        expect(updateLayout.execute).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalled();
    });

    it("returns the decoratee's failure as is", async () => {
        decoratee.execute.mockImplementation(async () => Result.fail(new Error("Nope") as any));

        const result = await translate();

        expect(result.isFail()).toBe(true);
        expect(ai.generateText).not.toHaveBeenCalled();
    });
});
