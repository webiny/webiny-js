import React, { FC } from "react";

import { Toolbar } from "~/components/Toolbar/Toolbar";

interface HeadingToolbarProps {
    anchorElem?: HTMLElement;
}

export const HeadingToolbar: FC<HeadingToolbarProps> = ({ anchorElem = document.body }) => {
    return <Toolbar type={"heading"} anchorElem={anchorElem} />;
};
