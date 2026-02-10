import { createLexicalStateTransformer } from "@webiny/lexical-converter";
import { RichTextEditor } from "@webiny/lexical-editor";

type LexicalStateTransformer = ReturnType<typeof createLexicalStateTransformer>;

export type RichTextValueWithHtml = {
    state: string;
    html: string;
};

export type EditorConfigRef = React.MutableRefObject<RichTextEditor.InitialConfig | undefined>;

const transformerCache = new Map<string, LexicalStateTransformer>();

const getOrCreate = (editorConfigRef: EditorConfigRef) => {
    if (!editorConfigRef.current) {
        return undefined;
    }

    const id = editorConfigRef.current.editorId;

    if (!transformerCache.has(id)) {
        const transformer = createLexicalStateTransformer({
            editorConfig: {
                nodes: editorConfigRef.current.nodes,
                theme: editorConfigRef.current.theme
            }
        });

        transformerCache.set(id, transformer);
    }

    return transformerCache.get(id);
};

export const lexicalValueWithHtml = (
    editorConfigRef: EditorConfigRef,
    onChange: (value: RichTextValueWithHtml) => void
) => {
    return (value: string) => {
        const transformer = getOrCreate(editorConfigRef);

        if (!transformer) {
            onChange({
                state: value,
                html: ""
            });
            return;
        }

        onChange({
            state: value,
            html: transformer.toHtml(value)
        });
    };
};
