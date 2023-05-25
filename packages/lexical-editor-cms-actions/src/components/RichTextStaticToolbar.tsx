import React, { FC } from "react";
import { StaticToolbar } from "@webiny/lexical-editor";

interface ParagraphToolbarProps {
    onActionClick?: (type: string, action: Record<string, any>) => void;
    actionPlugins?: { type: string; plugin: Record<string, any> }[];
}

export const STATIC_TOOLBAR_TYPE = "lexical-rich-text-static-toolbar";

/**
 * Static toolbar that will be always visible above the text input
 * @param anchorElem
 * @constructor
 */
export const RichTextStaticToolbar: FC<ParagraphToolbarProps> = ({ actionPlugins }) => {
    return <StaticToolbar actionPlugins={actionPlugins} type={STATIC_TOOLBAR_TYPE} />;
};
