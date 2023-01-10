import React from "react";
import { HeadingEditor, ParagraphEditor } from "@webiny/lexical-editor";
import { EditorStateJSONString } from "@webiny/lexical-editor/types";

interface LexicalEditorProps {
    tag: string | [string, Record<string, any>];
    value: EditorStateJSONString | null;
    onChange?: (json: EditorStateJSONString) => void;
}

/*
 * @description Implementation of the lexical editor.
 * @feature-flag: 1.0
 * @version: version 1.0
 * */
export const LexicalEditor: React.FC<LexicalEditorProps> = ({ tag, value, onChange }) => {
    const isHeadingTag = (tagValue: string | [string, Record<string, any>]): boolean => {
        const tagName = Array.isArray(tagValue) ? tagValue[0] : tagValue;
        return tagName.toLowerCase().includes("h");
    };

    return (
        <>
            {isHeadingTag(tag) ? (
                <HeadingEditor value={value} onChange={onChange} />
            ) : (
                <ParagraphEditor value={value} onChange={onChange} />
            )}
        </>
    );
};
