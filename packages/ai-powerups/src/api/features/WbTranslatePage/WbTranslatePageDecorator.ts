import set from "lodash/set";
import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { GetDefaultLanguageUseCase } from "@webiny/languages/exports/api/languages.js";
import { TranslatePageUseCase } from "@webiny/api-website-builder/features/pages/TranslatePage/index.js";
import { UpdatePageRepository } from "@webiny/api-website-builder/features/pages/UpdatePage/abstractions.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import { LexicalParser } from "./abstractions/LexicalParser.js";

type InputType = "text" | "longText" | "lexical";

interface TranslatableBinding {
    type: InputType;
    value: string;
}

type TranslatableBindings = Record<string, TranslatableBinding>;

interface TranslatedBindings {
    [key: string]: { type: InputType; value: string };
}

interface TranslatedData {
    properties: Record<string, string>;
    bindings: TranslatedBindings;
}

class WbTranslatePageDecoratorImpl implements TranslatePageUseCase.Interface {
    constructor(
        private getDefaultLanguage: GetDefaultLanguageUseCase.Interface,
        private getSettings: GetSettingsUseCase.Interface,
        private ai: Ai.Interface,
        private encryption: Encryption.Interface,
        private lexicalParser: LexicalParser.Interface,
        private updatePageRepository: UpdatePageRepository.Interface,
        private decoratee: TranslatePageUseCase.Interface
    ) {}

    async execute(params: TranslatePageUseCase.Params): TranslatePageUseCase.Return {
        const result = await this.decoratee.execute(params);
        if (result.isFail()) {
            return result;
        }

        const page = result.value;
        const sourceLanguage = await this.resolveSourceLanguage(page);

        const translations = await this.translate(page, sourceLanguage, params.languageCode);
        if (!translations) {
            return Result.ok(page);
        }

        const updateData = await this.buildUpdateData(page, translations);
        const updateResult = await this.updatePageRepository.execute(page.id, updateData);
        if (updateResult.isFail()) {
            return Result.ok(page);
        }

        return Result.ok(updateResult.value);
    }

    private async resolveSourceLanguage(page: WbPage): Promise<string> {
        if (page.properties["sourcePage"]) {
            return page.properties["language"] ?? "en";
        }

        const result = await this.getDefaultLanguage.execute();
        if (result.isOk()) {
            return result.value.code;
        }

        return "en";
    }

    private async translate(
        page: WbPage,
        sourceLanguage: string,
        targetLanguage: string
    ): Promise<TranslatedData | null> {
        const settingsResult = await this.getSettings.execute();
        if (settingsResult.isFail()) {
            return null;
        }

        const settings = settingsResult.value;
        const firstProvider = settings.providers.presets[0];

        if (!firstProvider) {
            return null;
        }

        const apiKey = await this.encryption.decrypt(firstProvider.apiKeyEncrypted);

        const properties = {
            title: page.properties["title"],
            snippet: page.properties["snippet"],
            pathSlug: page.properties["title"]
        };
        const bindings = this.extractBindings(page.bindings);
        const input = JSON.stringify({ properties, bindings });

        const result = await this.ai.generateText({
            model: firstProvider.model,
            connection: {
                sdkName: firstProvider.model.split("/")[0],
                apiKey
            },
            system: `You are a professional translator. Translate all user-provided text to language code "${targetLanguage}", preserving placeholders and formatting. Return a JSON object with the same keys, only changing the values.`,
            prompt: `Translate given key-value pairs from "${sourceLanguage}" to language code "${targetLanguage}". Do not modify the keys. "properties" is a simple key-value pair. "bindings" values are located in the "value" key. ${input}`,
            temperature: 0.3
        });

        try {
            return JSON.parse(result.text);
        } catch {
            return null;
        }
    }

    private extractBindings(bindings: Record<string, any>): TranslatableBindings {
        const result: TranslatableBindings = {};

        for (const elementId in bindings) {
            const element = bindings[elementId];
            const inputs = element.inputs;
            if (!inputs) {
                continue;
            }

            for (const inputName in inputs) {
                const input = inputs[inputName];
                if (input.type === "text" || input.type === "longText") {
                    result[`${elementId}.inputs.${inputName}`] = {
                        type: input.type,
                        value: input.static
                    };
                } else if (input.type === "lexical" && input.static?.html) {
                    result[`${elementId}.inputs.${inputName}`] = {
                        type: input.type,
                        value: input.static.html
                    };
                }
            }
        }

        return result;
    }

    private slugify(text: string): string {
        return text
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    private async buildUpdateData(
        page: WbPage,
        translations: TranslatedData
    ): Promise<{ properties: Record<string, any>; bindings: Record<string, any> }> {
        const properties: Record<string, any> = { ...page.properties };
        const bindings: Record<string, any> = structuredClone(page.bindings);

        const translatedPathSlug = translations.properties["pathSlug"];
        delete translations.properties["pathSlug"];

        for (const [key, value] of Object.entries(translations.properties)) {
            properties[key] = value;
        }

        if (translatedPathSlug) {
            const slug = this.slugify(translatedPathSlug);
            if (slug) {
                const languageCode = page.properties["language"];
                properties["path"] = `/${languageCode}/${slug}`;
            }
        }

        for (const [key, binding] of Object.entries(translations.bindings)) {
            if (binding.type === "lexical") {
                const state = await this.lexicalParser.parse(binding.value);
                if (state) {
                    set(bindings, `${key}.static.state`, JSON.stringify(state));
                    set(bindings, `${key}.static.html`, binding.value);
                }
            } else {
                set(bindings, `${key}.static`, binding.value);
            }
        }

        return { properties, bindings };
    }
}

export const WbTranslatePageDecorator = TranslatePageUseCase.createDecorator({
    decorator: WbTranslatePageDecoratorImpl,
    dependencies: [
        GetDefaultLanguageUseCase,
        GetSettingsUseCase,
        Ai,
        Encryption,
        LexicalParser,
        UpdatePageRepository
    ]
});
