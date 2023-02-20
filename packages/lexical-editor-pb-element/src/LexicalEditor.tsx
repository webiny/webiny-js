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
    onBlur?: (editorState: EditorStateJSONString) => void;
}

export const LexicalEditor: React.FC<LexicalEditorProps> = ({
    tag,
    initValue,
    value,
    onChange,
    ...rest
}) => {
    return (
        <>
            {isHeadingTag(tag) && (
                <HeadingEditor initValue={initValue} value={value} onChange={onChange} {...rest} />
            )}
            {isParagraphTag(tag) ? (
                <ParagraphEditor
                    initValue={initValue}
                    value={value}
                    onChange={onChange}
                    {...rest}
                />
            ) : null}
        </>
    );
};
