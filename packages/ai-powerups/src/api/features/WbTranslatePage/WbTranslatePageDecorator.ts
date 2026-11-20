import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { GetDefaultLanguageUseCase } from "@webiny/languages/exports/api/languages.js";
import { TranslatePageUseCase } from "@webiny/api-website-builder/features/pages/TranslatePage/index.js";
import { UpdatePageRepository } from "@webiny/api-website-builder/features/pages/UpdatePage/abstractions.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { GetPageByIdUseCase } from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import {
    ListGlobalComponentsUseCase,
    ListPageGlobalComponentsUseCase,
    SaveGlobalComponentRepository,
    type GlobalComponent
} from "@webiny/api-website-builder/exports/api/website-builder/globals.js";
import { AiCapabilityDisabledError } from "~/api/features/Capabilities/index.js";
import {
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

interface TranslatedData {
    properties: Record<string, string>;
    bindings: TranslatableBindings;
    globals?: TranslatableGlobals;
}

class WbTranslatePageDecoratorImpl implements TranslatePageUseCase.Interface {
    constructor(
        private getDefaultLanguage: GetDefaultLanguageUseCase.Interface,
        private getPageById: GetPageByIdUseCase.Interface,
        private resolveCapability: ResolveAiCapabilityUseCase.Interface,
        private logger: Logger.Interface,
        private ai: Ai.Interface,
        private lexicalParser: LexicalParser.Interface,
        private updatePageRepository: UpdatePageRepository.Interface,
        private listPageGlobalComponents: ListPageGlobalComponentsUseCase.Interface,
        private listGlobalComponents: ListGlobalComponentsUseCase.Interface,
        private saveGlobalComponentRepository: SaveGlobalComponentRepository.Interface,
        private decoratee: TranslatePageUseCase.Interface
    ) {}

    async execute(params: TranslatePageUseCase.Params): TranslatePageUseCase.Return {
        const result = await this.decoratee.execute(params);
        if (result.isFail()) {
            return result;
        }

        const page = result.value;
        const sourceLanguage = await this.resolveSourceLanguage(page);

        /*
         * The page's own overrides of globals and of its layout's elements are page data, so they're
         * translated with the rest of its bindings. Globals are stored apart from pages: those with no
         * record in the target language yet get one, translated in the same AI call. That covers globals
         * a frontend's code layout places, which no stored layout lists.
         */
        const globals = await this.getUntranslatedGlobalComponents(
            sourceLanguage,
            params.languageCode
        );
        const translations = await this.translate(
            page,
            globals,
            sourceLanguage,
            params.languageCode
        );
        if (!translations) {
            return Result.ok(page);
        }

        // Globals are stored apart from the page, so a failed page update doesn't stop them.
        await saveTranslatedGlobalComponents({
            globals,
            translated: translations.globals,
            language: params.languageCode,
            lexicalParser: this.lexicalParser,
            repository: this.saveGlobalComponentRepository,
            logger: this.logger
        });

        const updateData = await this.buildUpdateData(page, translations);
        const updateResult = await this.updatePageRepository.execute(page.id, updateData);
        if (updateResult.isFail()) {
            return Result.ok(page);
        }

        return Result.ok(updateResult.value);
    }

    /**
     * The global components the source page is shown with that have no record in the target language
     * yet: each in the source language, or its fallback. A global already stored in the target language
     * is never overwritten, so translating more pages, or translating again, keeps it as it is.
     */
    private async getUntranslatedGlobalComponents(
        sourceLanguage: string,
        targetLanguage: string
    ): Promise<GlobalComponent[]> {
        const [source, target] = await Promise.all([
            this.listPageGlobalComponents.execute({ language: sourceLanguage }),
            this.listGlobalComponents.execute({ language: targetLanguage })
        ]);

        if (source.isFail()) {
            this.logger.warn(
                { reason: source.error.message },
                "Skipping AI translation of global components."
            );
            return [];
        }
        if (target.isFail()) {
            this.logger.warn(
                { reason: target.error.message },
                "Skipping AI translation of global components."
            );
            return [];
        }

        const translatedNames = new Set(target.value.map(globalComponent => globalComponent.name));
        return source.value.filter(globalComponent => !translatedNames.has(globalComponent.name));
    }

    private async resolveSourceLanguage(page: WbPage): Promise<string> {
        if (page.properties["sourcePage"]) {
            const sourcePageId = `${page.properties["sourcePage"]}#0001`;
            const sourcePage = await this.getPageById.execute(sourcePageId);
            if (sourcePage.isOk()) {
                return sourcePage.value.properties["language"];
            }
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
        globals: GlobalComponent[],
        sourceLanguage: string,
        targetLanguage: string
    ): Promise<TranslatedData | null> {
        const resolved = await this.resolveCapability.execute(WB_TRANSLATE_PAGE_CAPABILITY);
        if (resolved.isFail()) {
            /*
             * Translation is a decorator on top of a successful page save, so it stays
             * non-fatal: the page is already created, just untranslated. A misconfiguration is
             * logged as a warning, because a silently skipped translation was indistinguishable
             * from a broken one. Switched off is not a problem, so it is only noted.
             */
            if (resolved.error instanceof AiCapabilityDisabledError) {
                this.logger.info("AI page translation is switched off; skipping.");
                return null;
            }
            this.logger.warn({ reason: resolved.error.message }, "Skipping AI page translation.");
            return null;
        }

        const capability = resolved.value;

        const properties = {
            title: page.properties["title"],
            snippet: page.properties["snippet"],
            pathSlug: page.properties["title"]
        };
        const bindings = extractTranslatableBindings(page.bindings);
        const input = JSON.stringify({
            properties,
            bindings,
            globals: extractTranslatableGlobals(globals)
        });

        const result = await this.ai.generateText({
            model: capability.model,
            connection: capability.connection,
            system: withAdditionalInstructions(capability),
            prompt: `Translate given key-value pairs from "${sourceLanguage}" to language code "${targetLanguage}". Do not modify the keys. "properties" is a simple key-value pair. "bindings" values are located in the "value" key. "globals" holds more bindings of the same shape, grouped by component name; keep the grouping. ${input}`,
            temperature: 0.3
        });

        try {
            return LlmJsonResponse.fromRawText(result.text).toJSON<TranslatedData>();
        } catch {
            return null;
        }
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

        const bindings = await applyTranslatedBindings(
            page.bindings,
            translations.bindings,
            this.lexicalParser
        );

        return { properties, bindings };
    }
}

export const WbTranslatePageDecorator = TranslatePageUseCase.createDecorator({
    decorator: WbTranslatePageDecoratorImpl,
    dependencies: [
        GetDefaultLanguageUseCase,
        GetPageByIdUseCase,
        ResolveAiCapabilityUseCase,
        Logger,
        Ai,
        LexicalParser,
        UpdatePageRepository,
        ListPageGlobalComponentsUseCase,
        ListGlobalComponentsUseCase,
        SaveGlobalComponentRepository
    ]
});
