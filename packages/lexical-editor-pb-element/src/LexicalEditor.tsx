import React from "react";
import { HeadingEditor, ParagraphEditor } from "@webiny/lexical-editor";
import { LexicalValue } from "@webiny/lexical-editor/types";
import { isHeadingTag } from "~/utils/isHeadingTag";
import { isParagraphTag } from "~/utils/isParagraphTag";

interface LexicalEditorProps {
    tag: string | [string, Record<string, any>];
    value: LexicalValue;
    onChange?: (value: LexicalValue) => void;
    onBlur?: (editorState: LexicalValue) => void;
}

export const LexicalEditor: React.FC<LexicalEditorProps> = ({ tag, value, onChange, ...rest }) => {
    return (
        <>
            {isHeadingTag(tag) && <HeadingEditor value={value} onChange={onChange} {...rest} />}
            {isParagraphTag(tag) ? (
                <ParagraphEditor value={value} onChange={onChange} {...rest} />
            ) : null}
        </>
    );
};
