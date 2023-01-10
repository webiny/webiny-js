import React from "react";
import { EditorStateJSONString } from "~/types";
import { RichTextEditor } from "~/components/Editor/RichTextEditor";
import { HeadingToolbar } from "~/components/Toolbar/HeadingToolbar";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ClickableLinkPlugin } from "~/plugins/ClickableLinkPlugin";
import { FloatingLinkEditorPlugin } from "~/plugins/FloatingLinkEditorPlugin";

interface HeadingEditorProps {
    value: EditorStateJSONString | null;
    onChange?: (editorState: EditorStateJSONString) => void;
    tag?: "h1" | "h2" | "h3" | "h4" | "h5";
    placeholder?: string;
}

export const HeadingEditor: React.FC<HeadingEditorProps> = ({ tag, placeholder, ...rest }) => {
    return (
        <RichTextEditor
            toolbar={<HeadingToolbar />}
            tag={tag ?? "h1"}
            placeholder={placeholder ?? "Enter your heading text here..."}
            {...rest}
        >
            <LinkPlugin />
            <ClickableLinkPlugin />
            <FloatingLinkEditorPlugin anchorElem={document.body} />
        </RichTextEditor>
    );
};
