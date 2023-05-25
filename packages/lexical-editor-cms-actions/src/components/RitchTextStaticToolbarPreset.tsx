import React from "react";
import {
    AddStaticToolbarAction,
    BoldAction,
    BulletListAction,
    CodeHighlightAction,
    Divider,
    //FontColorAction,
    FontSizeAction,
    InsertImageAction,
    ItalicAction,
    LinkAction,
    NumberedListAction,
    QuoteAction,
    TypographyAction,
    UnderlineAction
} from "@webiny/lexical-editor";
import { STATIC_TOOLBAR_TYPE } from "~/components/RichTextStaticToolbar";

export const RichTextStaticToolbarPreset = () => {
    return (
        <>
            <AddStaticToolbarAction element={<FontSizeAction />} type={STATIC_TOOLBAR_TYPE} />
            {/*   <AddStaticToolbarAction
                element={<FontColorAction />}
                type={STATIC_TOOLBAR_TYPE}
            />*/}
            {<AddStaticToolbarAction element={<TypographyAction />} type={STATIC_TOOLBAR_TYPE} />}
            <AddStaticToolbarAction element={<Divider />} type={STATIC_TOOLBAR_TYPE} />
            <AddStaticToolbarAction element={<BoldAction />} type={STATIC_TOOLBAR_TYPE} />
            <AddStaticToolbarAction element={<ItalicAction />} type={STATIC_TOOLBAR_TYPE} />
            <AddStaticToolbarAction element={<UnderlineAction />} type={STATIC_TOOLBAR_TYPE} />
            <AddStaticToolbarAction element={<CodeHighlightAction />} type={STATIC_TOOLBAR_TYPE} />
            <AddStaticToolbarAction element={<Divider />} type={STATIC_TOOLBAR_TYPE} />
            <AddStaticToolbarAction element={<NumberedListAction />} type={STATIC_TOOLBAR_TYPE} />
            <AddStaticToolbarAction element={<BulletListAction />} type={STATIC_TOOLBAR_TYPE} />
            <AddStaticToolbarAction element={<Divider />} type={STATIC_TOOLBAR_TYPE} />
            <AddStaticToolbarAction element={<InsertImageAction />} type={STATIC_TOOLBAR_TYPE} />
            <AddStaticToolbarAction element={<Divider />} type={STATIC_TOOLBAR_TYPE} />
            <AddStaticToolbarAction element={<LinkAction />} type={STATIC_TOOLBAR_TYPE} />
            <AddStaticToolbarAction element={<QuoteAction />} type={STATIC_TOOLBAR_TYPE} />
        </>
    );
};
