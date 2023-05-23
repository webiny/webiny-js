import React, { FC } from "react";
import { StaticToolbar } from "~/components/Toolbar/StaticToolbar";

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
    return <StaticToolbar actionPlugins={actionPlugins} type={"rich-text-static-toolbar"} />;
};
