import React from "react";
import { RichTextEditorProps } from "@webiny/ui/RichTextEditor";
import { FileManager } from "~/components";
import { ParagraphEditor } from "@webiny/lexical-editor";

export const LexicalEditor: React.FC<RichTextEditorProps> = props => {
    return <FileManager>{({ showFileManager }) => <div>Lexical editor</div>}</FileManager>;
};
