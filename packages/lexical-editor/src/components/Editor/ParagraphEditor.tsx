import React from "react";
import { RichTextEditor } from "~/components/Editor/RichTextEditor";
import { EditorStateJSONString } from "~/types";
import { CodeHighlightPlugin } from "~/plugins/CodeHighlightPlugin/CodeHighlightPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { FloatingLinkEditorPlugin } from "~/plugins/FloatingLinkEditorPlugin";
import { ClickableLinkPlugin } from "~/plugins/ClickableLinkPlugin";
import { ParagraphToolbar } from "~/components/Toolbar/ParagraphToolbar";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";

interface ParagraphLexicalEditorProps {
    value: EditorStateJSONString | null;
    onChange?: (json: EditorStateJSONString) => void;
}

// TODO: look at HeadingEditor and use the same approach

const ParagraphEditor: React.FC<ParagraphLexicalEditorProps> = props => {
    return (
        <RichTextEditor
            toolbar={<ParagraphToolbar />}
            tag={"p"}
            placeholder={"Enter your text here..."}
            {...props}
        >
            <LinkPlugin />
            <CodeHighlightPlugin />
            <ClickableLinkPlugin />
            <FloatingLinkEditorPlugin anchorElem={document.body} />
            <ListPlugin />
        </RichTextEditor>
    );
};

export { ParagraphEditor };
