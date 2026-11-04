import set from "lodash/set";
import type { LexicalParser } from "./abstractions/LexicalParser.js";
import { TranslatableBindingKey } from "~/domain/TranslatableBindingKey.js";

/**
 * Collecting the text of a document's bindings for the AI, and writing the translated text back.
 * Shared by page and layout translation. Every binding entry is walked, whatever element it's under:
 * a document's own elements, and its overrides of elements it doesn't own (globals, layout elements).
 */

export type TranslatableInputType = "text" | "longText" | "lexical";

export interface TranslatableBinding {
    type: TranslatableInputType;
    value: string;
}

// Keyed by `TranslatableBindingKey`.
export type TranslatableBindings = Record<string, TranslatableBinding>;

/**
 * The text, long text and rich text inputs of the given bindings, by binding key.
 */
export const extractTranslatableBindings = (
    bindings: Record<string, any> | null | undefined
): TranslatableBindings => {
    const result: TranslatableBindings = {};

    for (const elementId in bindings ?? {}) {
        const inputs = bindings![elementId]?.inputs;
        if (!inputs) {
            continue;
        }

        for (const inputName in inputs) {
            const input = inputs[inputName];
            const key = TranslatableBindingKey.from(elementId, inputName).toString();
            // An input marked as not translatable keeps its value in every language (e.g., the name of a
            // layout's page content area, which pages' content is stored under).
            if (!input || input.translatable === false) {
                continue;
            }
            if (input.type === "text" || input.type === "longText") {
                if (typeof input.static !== "string" || !input.static) {
                    continue;
                }
                result[key] = {
                    type: input.type,
                    value: input.static
                };
            } else if (input.type === "lexical" && input.static?.html) {
                result[key] = {
                    type: input.type,
                    value: input.static.html
                };
            }
        }
    }

    return result;
};

/**
 * A copy of the source bindings with the translated values written in. Inputs the AI left out keep
 * their source values; keys that don't name an input are ignored.
 */
export const applyTranslatedBindings = async (
    source: Record<string, any>,
    translated: Record<string, TranslatableBinding> | null | undefined,
    lexicalParser: LexicalParser.Interface
): Promise<Record<string, any>> => {
    const bindings: Record<string, any> = structuredClone(source ?? {});

    for (const [key, binding] of Object.entries(translated ?? {})) {
        const bindingKey = TranslatableBindingKey.parse(key);
        if (!bindingKey || !binding || typeof binding.value !== "string") {
            continue;
        }
        const { elementId, inputName } = bindingKey;
        // Only inputs that are in the source: an invented key must not create bindings.
        if (!bindings[elementId]?.inputs?.[inputName]) {
            continue;
        }
        // An array path, so lodash doesn't read the dots of an element id as nesting.
        const path = [elementId, "inputs", inputName, "static"];
        if (binding.type === "lexical") {
            const state = await lexicalParser.parse(binding.value);
            if (state) {
                set(bindings, [...path, "state"], JSON.stringify(state));
                set(bindings, [...path, "html"], binding.value);
            }
        } else {
            set(bindings, path, binding.value);
        }
    }

    return bindings;
};
