import { createLexicalStateTransformer } from "@webiny/lexical-converter";

type LexicalStateTransformer = ReturnType<typeof createLexicalStateTransformer>;

export type RichTextValue = {
    state: string;
    html: string;
};

export const withHtml = (
    transformer: LexicalStateTransformer,
    onChange: (value: RichTextValue) => void
) => {
    return (value: string) => {
        onChange({
            state: JSON.stringify(value),
            html: transformer.toHtml(value)
        });
    };
};
