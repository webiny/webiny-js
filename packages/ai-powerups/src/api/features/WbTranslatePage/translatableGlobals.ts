import type { Logger } from "@webiny/api-core/features/logger/index.js";
import type {
    GlobalComponent,
    SaveGlobalComponentRepository
} from "@webiny/api-website-builder/exports/api/website-builder/globals.js";
import type { LexicalParser } from "./abstractions/LexicalParser.js";
import {
    applyTranslatedBindings,
    extractTranslatableBindings,
    type TranslatableBindings
} from "./translatableBindings.js";

/**
 * Creating the target-language records of global components while a page or layout is translated.
 * Shared by page and layout translation. Each global's bindings are sent to the AI grouped by its name,
 * apart from the document's own bindings (which may override the same global).
 */

// The bindings of each global to create in the target language, by global name.
export type TranslatableGlobals = Record<string, TranslatableBindings>;

export const extractTranslatableGlobals = (globals: GlobalComponent[]): TranslatableGlobals => {
    const result: TranslatableGlobals = {};
    for (const globalComponent of globals) {
        const bindings = extractTranslatableBindings(globalComponent.bindings);
        if (Object.keys(bindings).length) {
            result[globalComponent.name] = bindings;
        }
    }
    return result;
};

interface SaveTranslatedGlobalComponentsParams {
    globals: GlobalComponent[];
    translated: TranslatableGlobals | null | undefined;
    language: string;
    lexicalParser: LexicalParser.Interface;
    repository: SaveGlobalComponentRepository.Interface;
    logger: Logger.Interface;
}

export const saveTranslatedGlobalComponents = async (
    params: SaveTranslatedGlobalComponentsParams
) => {
    const { globals, translated, language, lexicalParser, repository, logger } = params;

    for (const globalComponent of globals) {
        // Inputs the AI left out keep their source values; a global with no text is copied as is.
        const bindings = await applyTranslatedBindings(
            globalComponent.bindings,
            translated?.[globalComponent.name],
            lexicalParser
        );

        // Saved through the repository, as the page or layout is: translating takes create
        // permission, not the edit permission the save use case checks.
        const result = await repository.execute({
            name: globalComponent.name,
            language,
            elements: structuredClone(globalComponent.elements),
            bindings
        });

        if (result.isFail()) {
            logger.warn(
                { reason: result.error.message, name: globalComponent.name, language },
                "Could not save an AI translated global component."
            );
        }
    }
};
