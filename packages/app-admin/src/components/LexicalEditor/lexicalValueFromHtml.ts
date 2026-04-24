import { createHtmlToLexicalParser } from "@webiny/lexical-converter";
import { RichTextEditor } from "@webiny/lexical-editor";
import { lexicalValueWithHtml } from "~/components/LexicalEditor/lexicalValueWithHtml.js";

type LexicalHtmlTransformer = ReturnType<typeof createHtmlToLexicalParser>;

export type RichTextValueWithHtml = {
    state: string;
    html: string;
};

export type EditorConfigRef = React.MutableRefObject<RichTextEditor.InitialConfig | undefined>;

const parserCache = new Map<string, LexicalHtmlTransformer>();

const getOrCreate = (editorConfigRef: EditorConfigRef) => {
    if (!editorConfigRef.current) {
        return undefined;
    }

    const id = editorConfigRef.current.editorId;

    if (!parserCache.has(id)) {
        const parser = createHtmlToLexicalParser({
            editorConfig: {
                nodes: editorConfigRef.current.nodes,
                theme: editorConfigRef.current.theme
            }
        });

        parserCache.set(id, parser);
    }

    return parserCache.get(id);
};

export const lexicalValueFromHtml = (
    editorConfigRef: EditorConfigRef,
    onChange: (value: RichTextValueWithHtml) => void
) => {
    return (value: string) => {
        const parser = getOrCreate(editorConfigRef);

        if (!parser) {
            return;
        }

        const domParser = new DOMParser();
        const state = parser(domParser.parseFromString(value, "text/html"));

        if (!state) {
            return;
        }

        lexicalValueWithHtml(editorConfigRef, onChange)(JSON.stringify(state));
    };
};
