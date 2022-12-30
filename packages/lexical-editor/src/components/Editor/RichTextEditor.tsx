import React from "react";
import { EditorStateJSONString, RichTextEditorTag } from "../../types";
import { isHeadingTag } from "../../utils/htmlTags";
import { HeadingLexicalEditor } from "./HeadingLexicalEditor";
import { ParagraphLexicalEditor } from "./ParagraphLexicalEditor";

export interface EditorProps {
    onChange?: (json: EditorStateJSONString) => void;
    value: EditorStateJSONString | undefined | null;
}

export interface RichTextEditorProps extends EditorProps {
    tag: RichTextEditorTag;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ tag, ...rest }: RichTextEditorProps & EditorProps) => {
    return isHeadingTag(tag) ? <HeadingLexicalEditor {...rest} /> : <ParagraphLexicalEditor {...rest} />
}

export { RichTextEditor };
