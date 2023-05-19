import React, { FC } from "react";
import { Toolbar } from "~/components/Toolbar/Toolbar";
import {StaticToolbar} from "~/components/Toolbar/StaticToolbar";

interface ParagraphToolbarProps {
    anchorElem?: HTMLElement;
}

/**
 * Static toolbar that will be always visible above the text input
 * @param anchorElem
 * @constructor
 */
export const RichTextStaticToolbar: FC<ParagraphToolbarProps> = () => {
    return <StaticToolbar type={"rich-text-static-toolbar"}  />;
};
