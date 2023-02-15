import React from "react";
import { HeadingEditor, ParagraphEditor } from "@webiny/lexical-editor";
import { EditorStateJSONString } from "@webiny/lexical-editor/types";
import { isHeadingTag } from "~/utils/isHeadingTag";
import { isParagraphTag } from "~/utils/isParagraphTag";

interface LexicalEditorProps {
    tag: string | [string, Record<string, any>];
    initValue: EditorStateJSONString | null;
    value?: EditorStateJSONString | null;
    onChange?: (json: EditorStateJSONString) => void;
}

export const LexicalEditor: React.FC<LexicalEditorProps> = ({
    tag,
    initValue,
    value,
    onChange
}) => {
    return (
        <>
            {isHeadingTag(tag) && (
                <HeadingEditor initValue={initValue} value={value} onChange={onChange} />
            )}
            {isParagraphTag(tag) ? (
                <ParagraphEditor initValue={initValue} value={value} onChange={onChange} />
            ) : null}
        </>
    );
};
