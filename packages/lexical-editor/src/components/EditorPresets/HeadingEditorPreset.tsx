import {AddRichTextEditor} from "~/components/EditorComposable/AddRichTextEditor";
import React from "react";
import {LexicalAutoLinkPlugin} from "~/plugins/AutoLinkPlugin";
import {LinkPlugin} from "@lexical/react/LexicalLinkPlugin";
import FloatingLinkEditorPlugin from "~/plugins/FloatingLinkEditorPlugin";

export const HeadingEditorPreset = () => {
    return (
        <>
            <AddRichTextEditor forTag={"h1"} toolbarType={"heading"}>
                <LexicalAutoLinkPlugin />
                <LinkPlugin />
                <FloatingLinkEditorPlugin anchorElem={document.body} />
            </AddRichTextEditor>
        </>
    )};
