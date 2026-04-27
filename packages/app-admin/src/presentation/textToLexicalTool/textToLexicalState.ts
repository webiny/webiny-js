import { createHtmlToLexicalParser } from "@webiny/lexical-converter";
import { createLexicalStateTransformer } from "@webiny/lexical-converter";
import type { ILexicalContext } from "~/features/tools/LexicalContext/index.js";

export interface LexicalValue {
    state: string;
    html: string;
}

export function textToLexicalState(lexicalContext: ILexicalContext, text: string): LexicalValue {
    const lexicalTheme = lexicalContext.getTheme() ?? {};

    const editorConfig = {
        nodes: [...lexicalContext.getNodes()],
        theme: {
            $colors: lexicalTheme.colors,
            $typography: lexicalTheme.typography
        }
    };

    const parser = createHtmlToLexicalParser({ editorConfig });
    const domParser = new DOMParser();
    const state = parser(domParser.parseFromString(text, "text/html"));

    if (!state) {
        throw new Error("Failed to parse text into Lexical state.");
    }

    const stateJson = JSON.stringify(state);

    const transformer = createLexicalStateTransformer({ editorConfig });
    const html = transformer.toHtml(stateJson);

    return { state: stateJson, html };
}
