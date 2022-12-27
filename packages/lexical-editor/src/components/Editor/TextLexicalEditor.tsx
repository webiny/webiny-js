import React from "react";
import {isHeadingTag} from "~/utils/htmlTags";
import {HeadingLexicalEditor} from "~/components/Editor/HeadingLexicalEditor";
import {ParagraphLexicalEditor} from "~/components/Editor/ParagraphLexicalEditor";
import {EditorStateJSONString, TextLexicalEditorTag} from "~/types";

export interface EditorProps {
    onChange: (json: EditorStateJSONString) => void;
    value: EditorStateJSONString | undefined | null;
}

export interface TextLexicalEditorProps extends EditorProps {
    tag: TextLexicalEditorTag;
}

const TextLexicalEditor: React.FC<TextLexicalEditorProps> = ({ tag, ...rest }: TextLexicalEditorProps & EditorProps) => {
    return isHeadingTag(tag) ? <HeadingLexicalEditor {...rest} /> : <ParagraphLexicalEditor {...rest} />
}

export { TextLexicalEditor };
