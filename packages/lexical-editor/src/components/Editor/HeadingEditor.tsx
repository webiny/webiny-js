import React from "react";
import { EditorStateJSONString } from "~/types";
import { RichTextEditor} from "~/components/Editor/RichTextEditor";
import {HeadingToolbar} from "~/components/Toolbar/HeadingToolbar";
import {LinkPlugin} from "@lexical/react/LexicalLinkPlugin";
import {ClickableLinkPlugin} from "~/plugins/ClickableLinkPlugin";
import {FloatingLinkEditorPlugin} from "~/plugins/FloatingLinkEditorPlugin";


interface HeadingEditorProps  {
    value: EditorStateJSONString | null;
    onChange?: (editorState: EditorStateJSONString) => void;
}

const HeadingEditor: React.FC<HeadingEditorProps> = (props) => {
    return (
        <RichTextEditor toolbar={<HeadingToolbar />} tag={"h1"} placeholder={"Enter your heading text here..."} {...props} >
            <LinkPlugin />
            <ClickableLinkPlugin />
            <FloatingLinkEditorPlugin anchorElem={document.body} />
        </RichTextEditor>
    );
};

export { HeadingEditor };
