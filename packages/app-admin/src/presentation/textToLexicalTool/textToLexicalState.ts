import { createHtmlToLexicalParser } from "@webiny/lexical-converter";
import { createLexicalStateTransformer } from "@webiny/lexical-converter";

export interface LexicalValue {
    state: string;
    html: string;
}

export function textToLexicalState(text: string): LexicalValue {
    const parser = createHtmlToLexicalParser();
    const domParser = new DOMParser();
    const state = parser(domParser.parseFromString(text, "text/html"));

    if (!state) {
        throw new Error("Failed to parse text into Lexical state.");
    }

    const stateJson = JSON.stringify(state);

    const transformer = createLexicalStateTransformer();
    const html = transformer.toHtml(stateJson);

    return { state: stateJson, html };
}
