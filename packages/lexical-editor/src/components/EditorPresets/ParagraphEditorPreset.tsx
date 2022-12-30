import {AddRichTextEditor} from "~/components/EditorComposable/AddRichTextEditor";
import React from "react";
import {LexicalAutoLinkPlugin} from "~/plugins/AutoLinkPlugin";
import {LinkPlugin} from "@lexical/react/LexicalLinkPlugin";
import FloatingLinkEditorPlugin from "~/plugins/FloatingLinkEditorPlugin";
import {ListPlugin} from "@lexical/react/LexicalListPlugin";
import {AddToolbarAction} from "~/components/ToolbarComposable/AddToolbarAction";
import {FontSizeAction} from "~/components/ToolbarActions/FontSizeAction";
import {Divider} from "~/ui/Divider";
import {BoldAction} from "~/components/ToolbarActions/BoldAction";
import {ItalicAction} from "~/components/ToolbarActions/ItalicAction";
import {UnderlineAction} from "~/components/ToolbarActions/UnderlineAction";
import {CodeHighlightAction} from "~/components/ToolbarActions/CodeHighlightAction";
import {NumberedListAction} from "~/components/ToolbarActions/NumberedListAction";
import {BulletListAction} from "~/components/ToolbarActions/BulletListAction";
import {LinkAction} from "~/components/ToolbarActions/LinkAction";
import {QuoteAction} from "~/components/ToolbarActions/QuoteAction";

const TOOLBAR_TYPE = "paragraph";
export const ParagraphEditorPreset = () => {
    return (
        <>
            <AddRichTextEditor forTag={"p"} toolbarType={TOOLBAR_TYPE}>
                <LexicalAutoLinkPlugin />
                <LinkPlugin />
                <FloatingLinkEditorPlugin anchorElem={document.body} />
                <ListPlugin />
            </AddRichTextEditor>
            {/* TOOLBAR ACTIONS */}
            <AddToolbarAction element={<FontSizeAction />} type={TOOLBAR_TYPE} />
            <AddToolbarAction element={<Divider />} type={TOOLBAR_TYPE} />
            <AddToolbarAction element={<BoldAction />} type={TOOLBAR_TYPE} />
            <AddToolbarAction element={<ItalicAction />} type={TOOLBAR_TYPE} />
            <AddToolbarAction element={<UnderlineAction />} type={TOOLBAR_TYPE} />
            <AddToolbarAction element={<CodeHighlightAction />} type={TOOLBAR_TYPE} />
            <AddToolbarAction element={<Divider />} type={TOOLBAR_TYPE} />
            <AddToolbarAction element={<NumberedListAction />} type={TOOLBAR_TYPE} />
            <AddToolbarAction element={<BulletListAction />} type={TOOLBAR_TYPE} />
            <AddToolbarAction element={<Divider />} type={TOOLBAR_TYPE} />
            <AddToolbarAction element={<LinkAction />} type={TOOLBAR_TYPE} />
            <AddToolbarAction element={<QuoteAction />} type={TOOLBAR_TYPE} />
        </>
    )};
