import React from "react";
import { HeadingEditor, ParagraphEditor } from "@webiny/lexical-editor";
import { EditorStateJSONString } from "@webiny/lexical-editor/types";
import { isHeadingTag } from "~/utils/isHeadingTag";
import { isParagraphTag } from "~/utils/isParagraphTag";

interface LexicalEditorProps {
    tag: string | [string, Record<string, any>];
    value: EditorStateJSONString | null;
    onChange?: (json: EditorStateJSONString) => void;
}

export const LexicalEditor: React.FC<LexicalEditorProps> = ({ tag, value, onChange }) => {
    return (
        <>
            {isHeadingTag(tag) && <HeadingEditor value={value} onChange={onChange} />}
            {isParagraphTag(tag) ? <ParagraphEditor value={value} onChange={onChange} /> : null}
        </>
    );
};
