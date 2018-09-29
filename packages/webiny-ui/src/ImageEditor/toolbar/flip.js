// @flow
import React from "react";
import type { ImageEditorTool } from "./types";
import { FlipIcon } from "./icons";
import { IconButton } from "webiny-ui/Button";

const subMenu = ({ imageEditor, clearTool }) => {
    return (
        <ul>
            <li onClick={() => imageEditor.flipX()}>FlipX</li>
            <li onClick={() => imageEditor.flipY()}>FlipY</li>
            <li onClick={() => imageEditor.resetFlip()}>Reset</li>
            <li onClick={clearTool}>Close</li>
        </ul>
    );
};

const tool: ImageEditorTool = {
    name: "flip",
    icon: () => <FlipIcon />,
    subMenu,
    onClick: imageEditor => {
        imageEditor.stopDrawingMode();
    }
};

export default tool;
