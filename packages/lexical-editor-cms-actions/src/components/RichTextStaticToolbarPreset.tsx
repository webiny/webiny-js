import React from "react";
import {
    AddStaticToolbarAction,
    BoldAction,
    BulletListAction,
    CodeHighlightAction,
    Divider,
    FontColorAction,
    FontSizeAction,
    ImageAction,
    ItalicAction,
    LinkAction,
    NumberedListAction,
    QuoteAction,
    TypographyAction,
    UnderlineAction
} from "@webiny/lexical-editor";

export const RICH_TEXT_CMS_STATIC_TOOLBAR = "rich-text-cms-static-toolbar";

export const RichTextStaticToolbarPreset = () => {
    return (
        <>
            <AddStaticToolbarAction
                element={<FontSizeAction />}
                type={RICH_TEXT_CMS_STATIC_TOOLBAR}
            />
            <AddStaticToolbarAction
                element={<FontColorAction />}
                type={RICH_TEXT_CMS_STATIC_TOOLBAR}
            />
            <AddStaticToolbarAction
                element={<TypographyAction />}
                type={RICH_TEXT_CMS_STATIC_TOOLBAR}
            />
            <AddStaticToolbarAction element={<Divider />} type={RICH_TEXT_CMS_STATIC_TOOLBAR} />
            <AddStaticToolbarAction element={<BoldAction />} type={RICH_TEXT_CMS_STATIC_TOOLBAR} />
            <AddStaticToolbarAction
                element={<ItalicAction />}
                type={RICH_TEXT_CMS_STATIC_TOOLBAR}
            />
            <AddStaticToolbarAction
                element={<UnderlineAction />}
                type={RICH_TEXT_CMS_STATIC_TOOLBAR}
            />

            <AddStaticToolbarAction
                element={<CodeHighlightAction />}
                type={RICH_TEXT_CMS_STATIC_TOOLBAR}
            />
            <AddStaticToolbarAction element={<Divider />} type={RICH_TEXT_CMS_STATIC_TOOLBAR} />
            <AddStaticToolbarAction
                element={<NumberedListAction />}
                type={RICH_TEXT_CMS_STATIC_TOOLBAR}
            />
            <AddStaticToolbarAction
                element={<BulletListAction />}
                type={RICH_TEXT_CMS_STATIC_TOOLBAR}
            />
            <AddStaticToolbarAction element={<Divider />} type={RICH_TEXT_CMS_STATIC_TOOLBAR} />
            <AddStaticToolbarAction element={<ImageAction />} type={RICH_TEXT_CMS_STATIC_TOOLBAR} />
            <AddStaticToolbarAction element={<Divider />} type={RICH_TEXT_CMS_STATIC_TOOLBAR} />
            <AddStaticToolbarAction element={<LinkAction />} type={RICH_TEXT_CMS_STATIC_TOOLBAR} />
            <AddStaticToolbarAction element={<QuoteAction />} type={RICH_TEXT_CMS_STATIC_TOOLBAR} />
        </>
    );
};
