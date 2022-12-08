import React, { FC } from "react";
import { createPortal } from "react-dom";
import { Toolbar } from "~/components/Toolbar/Toolbar";

interface HeadingToolbarProps {
    anchorElem?: HTMLElement;
}

export const HeadingToolbar: FC<HeadingToolbarProps> = ({ anchorElem = document.body }) => {
    return createPortal(<Toolbar type={"heading"} anchorElem={anchorElem} />, anchorElem);
};
