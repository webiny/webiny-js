import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { GetDefaultLanguageUseCase } from "@webiny/languages/exports/api/languages.js";
import {
    GetLayoutUseCase,
    TranslateLayoutUseCase,
    UpdateLayoutRepository,
    type WbLayout
} from "@webiny/api-website-builder/exports/api/website-builder/layouts.js";
import {
    GlobalComponentLanguage,
    ListGlobalComponentsUseCase,
    SaveGlobalComponentRepository,
    type GlobalComponent
} from "@webiny/api-website-builder/exports/api/website-builder/globals.js";
import {
    AiCapabilityDisabledError,
    ResolveAiCapabilityUseCase,
    withAdditionalInstructions
} from "~/api/features/Capabilities/index.js";
import { WB_TRANSLATE_PAGE_CAPABILITY } from "./capability.js";
import { LexicalParser } from "./abstractions/LexicalParser.js";
import {
    applyTranslatedBindings,
    extractTranslatableBindings,
    type TranslatableBindings
} from "./translatableBindings.js";
import {
    extractTranslatableGlobals,
    saveTranslatedGlobalComponents,
    type TranslatableGlobals
} from "./translatableGlobals.js";
import { LlmJsonResponse } from "~/domain/LlmJsonResponse.js";

interface TranslationInput {
    // The layout's own bindings, including its overrides of globals.
    bindings: TranslatableBindings;
    // The bindings of each global to create in the target language, by global name.
    globals: TranslatableGlobals;
}

type TranslatedData = Partial<TranslationInput>;

/**
 * Translates a new language version of a layout, and creates the target-language records of the
 * globals placed in it that don't have one yet. It runs under the "Page translation" capability.
 * Like page translation it is non-fatal: the language version is already created, just untranslated.
 */
class WbTranslateLayoutDecoratorImpl implements TranslateLayoutUseCase.Interface {
    constructor(
        private getDefaultLanguage: GetDefaultLanguageUseCase.Interface,
        private resolveCapability: ResolveAiCapabilityUseCase.Interface,
        private logger: Logger.Interface,
        private ai: Ai.Interface,
        private lexicalParser: LexicalParser.Interface,
        private getLayout: GetLayoutUseCase.Interface,
        private updateLayoutRepository: UpdateLayoutRepository.Interface,
        private listGlobalComponents: ListGlobalComponentsUseCase.Interface,
        private saveGlobalComponentRepository: SaveGlobalComponentRepository.Interface,
        private decoratee: TranslateLayoutUseCase.Interface
    ) {}

    async execute(params: TranslateLayoutUseCase.Params): TranslateLayoutUseCase.Return {
        const result = await this.decoratee.execute(params);
        if (result.isFail()) {
            return result;
        }

        try {
            return await this.translateLayout(params, result.value);
        } catch (error) {
            this.logger.warn(
                { reason: error instanceof Error ? error.message : String(error) },
                "AI layout translation failed."
            );
            return result;
        }
    }

    private async translateLayout(
        params: TranslateLayoutUseCase.Params,
        layout: WbLayout
    ): TranslateLayoutUseCase.Return {
        const resolved = await this.resolveCapability.execute(WB_TRANSLATE_PAGE_CAPABILITY);
        if (resolved.isFail()) {
            if (resolved.error instanceof AiCapabilityDisabledError) {
                this.logger.info("AI page translation is switched off; skipping layout.");
                return Result.ok(layout);
            }
            this.logger.warn({ reason: resolved.error.message }, "Skipping AI layout translation.");
            return Result.ok(layout);
        }
        const capability = resolved.value;

        const targetLanguage = GlobalComponentLanguage.from(params.language);
        const sourceLanguage = await this.getSourceLanguage(params.id);

        const globals = await this.getUntranslatedGlobalComponents(
            layout,
            sourceLanguage,
            targetLanguage
        );

        const input: TranslationInput = {
            bindings: extractTranslatableBindings(layout.bindings),
            globals: extractTranslatableGlobals(globals)
        };

        const hasLayoutText = Object.keys(input.bindings).length > 0;
        const hasGlobalText = Object.keys(input.globals).length > 0;

        let translations: TranslatedData = {};
        if (hasLayoutText || hasGlobalText) {
            const promptLanguage = sourceLanguage.isDefault()
                ? await this.getDefaultLanguageCode()
                : sourceLanguage.toString();
            const translated = await this.requestTranslation(
                capability,
                promptLanguage,
                targetLanguage.toString(),
                input
            );
            if (!translated) {
                this.logger.warn(
                    { id: layout.id, language: targetLanguage.toString() },
                    "The AI layout translation could not be read; the layout stays untranslated."
                );
                return Result.ok(layout);
            }
            translations = translated;
        }

        // Globals are stored apart from the layout, so a failed layout update doesn't stop them.
        await saveTranslatedGlobalComponents({
            globals,
            translated: translations.globals,
            language: targetLanguage.toString(),
            lexicalParser: this.lexicalParser,
            repository: this.saveGlobalComponentRepository,
            logger: this.logger
        });

        if (!hasLayoutText) {
            return Result.ok(layout);
        }

        const bindings = await applyTranslatedBindings(
            layout.bindings,
            translations.bindings,
            this.lexicalParser
        );

        // The new language version is a draft, so it is written directly, as page translation does.
        const updateResult = await this.updateLayoutRepository.execute(layout.id, {
            properties: layout.properties,
            metadata: layout.metadata,
            elements: layout.elements,
            bindings,
            extensions: layout.extensions
        });
        if (updateResult.isFail()) {
            this.logger.warn(
                { reason: updateResult.error.message, id: layout.id },
                "Could not save the AI translated layout."
            );
            return Result.ok(layout);
        }

        return Result.ok(updateResult.value);
    }

    /**
     * The language of the source layout: `"default"` if it has none.
     */
    private async getSourceLanguage(sourceId: string): Promise<GlobalComponentLanguage> {
        const source = await this.getLayout.execute(sourceId);
        if (source.isFail()) {
            return GlobalComponentLanguage.default();
        }
        return GlobalComponentLanguage.from(source.value.properties.language);
    }

    // The language named in the prompt when the source layout has none, as for pages.
    private async getDefaultLanguageCode(): Promise<string> {
        const result = await this.getDefaultLanguage.execute();
        if (result.isOk()) {
            return result.value.code;
        }
        return "en";
    }

    /**
     * The records to create in the target language: for each global placed in the layout that has no
     * record in the target language yet, its record in the source language, else its `"default"` one.
     * A global already stored in the target language is never overwritten. A placed component with no
     * record at all isn't a stored global, and is skipped.
     */
    private async getUntranslatedGlobalComponents(
        layout: WbLayout,
        sourceLanguage: GlobalComponentLanguage,
        targetLanguage: GlobalComponentLanguage
    ): Promise<GlobalComponent[]> {
        const placedNames = new Set<string>();
        for (const element of Object.values<any>(layout.elements ?? {})) {
            const name = element?.component?.name;
            if (typeof name === "string" && name) {
                placedNames.add(name);
            }
        }
        if (!placedNames.size) {
            return [];
        }

        const languages: GlobalComponentLanguage[] = [];
        for (const language of [
            targetLanguage,
            sourceLanguage,
            GlobalComponentLanguage.default()
        ]) {
            if (!languages.some(listed => listed.equals(language))) {
                languages.push(language);
            }
        }
        const results = await Promise.all(
            languages.map(language =>
                this.listGlobalComponents.execute({ language: language.toString() })
            )
        );

        const byLanguage: {
            language: GlobalComponentLanguage;
            records: Map<string, GlobalComponent>;
        }[] = [];
        for (const [index, listed] of results.entries()) {
            if (listed.isFail()) {
                this.logger.warn(
                    { reason: listed.error.message, language: languages[index].toString() },
                    "Skipping AI translation of global components."
                );
                return [];
            }
            byLanguage.push({
                language: languages[index],
                records: new Map(
                    listed.value.map(globalComponent => [globalComponent.name, globalComponent])
                )
            });
        }
        const recordsIn = (language: GlobalComponentLanguage) =>
            byLanguage.find(listed => listed.language.equals(language))!.records;

        const target = recordsIn(targetLanguage);
        const source = recordsIn(sourceLanguage);
        const fallback = recordsIn(GlobalComponentLanguage.default());

        const untranslated: GlobalComponent[] = [];
        for (const name of placedNames) {
            if (target.has(name)) {
                continue;
            }
            const record = source.get(name) ?? fallback.get(name);
            if (record) {
                untranslated.push(record);
            }
        }
        return untranslated;
    }

    private async requestTranslation(
        capability: ResolveAiCapabilityUseCase.Resolution,
        sourceLanguage: string,
        targetLanguage: string,
        input: TranslationInput
    ): Promise<TranslatedData | null> {
        const result = await this.ai.generateText({
            model: capability.model,
            connection: capability.connection,
            system: withAdditionalInstructions(capability),
            prompt: `Translate given key-value pairs from "${sourceLanguage}" to language code "${targetLanguage}". Do not modify the keys. "bindings" values are located in the "value" key. "globals" holds more bindings of the same shape, grouped by component name; keep the grouping. ${JSON.stringify(input)}`,
            temperature: 0.3
        });

        try {
            return LlmJsonResponse.fromRawText(result.text).toJSON<TranslatedData>();
        } catch {
            return null;
        }
    }
}

export const WbTranslateLayoutDecorator = TranslateLayoutUseCase.createDecorator({
    decorator: WbTranslateLayoutDecoratorImpl,
    dependencies: [
        GetDefaultLanguageUseCase,
        ResolveAiCapabilityUseCase,
        Logger,
        Ai,
        LexicalParser,
        GetLayoutUseCase,
        UpdateLayoutRepository,
        ListGlobalComponentsUseCase,
        SaveGlobalComponentRepository
    ]
});
