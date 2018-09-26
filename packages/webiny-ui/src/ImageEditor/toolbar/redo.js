// @flow
import React from "react";
import { RedoIcon } from "./icons";
import type { ImageEditorTool } from "./types";

const tool: ImageEditorTool = {
    name: "redo",
    icon: <RedoIcon />,
    onClick: imageEditor => {
        imageEditor.redo();
    }
};

export default tool;
