// @flow
import React from "react";
import type { ImageEditorTool } from "./types";
import { ReactComponent as FlipIcon } from "./icons/flip.svg";

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
    icon({ imageEditor, enableTool }) {
        return (
            <IconButton
                icon={<FlipIcon />}
                onClick={() => {
                    enableTool();
                    imageEditor.stopDrawingMode();
                }}
            />
        );
    },
    subMenu
};

export default tool;
