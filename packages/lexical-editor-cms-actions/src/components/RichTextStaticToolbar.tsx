import React, { FC } from "react";
import { StaticToolbar } from "@webiny/lexical-editor";
import { RICH_TEXT_CMS_STATIC_TOOLBAR } from "~/components/RichTextStaticToolbarPreset";

interface ParagraphToolbarProps {
    onActionClick?: (type: string, action: Record<string, any>) => void;
    actionPlugins?: { type: string; plugin: Record<string, any> }[];
}

/**
 * Static toolbar that will be always visible above the text input
 * @param anchorElem
 * @constructor
 */
export const RichTextStaticToolbar: FC<ParagraphToolbarProps> = ({ actionPlugins }) => {
    return <StaticToolbar actionPlugins={actionPlugins} type={RICH_TEXT_CMS_STATIC_TOOLBAR} />;
};
