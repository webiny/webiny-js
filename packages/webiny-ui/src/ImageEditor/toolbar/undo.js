// @flow
import React from "react";
import { UndoIcon } from "./icons";
import type { ImageEditorTool } from "./types";

const tool: ImageEditorTool = {
    name: "undo",
    icon: <UndoIcon />,
    onClick: imageEditor => {
        imageEditor.undo();
    }
};

export default tool;
