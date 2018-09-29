// @flow
import React from "react";
import { UndoIcon } from "./icons";
import type { ImageEditorTool } from "./types";
import { IconButton } from "webiny-ui/Button";

const tool: ImageEditorTool = {
    name: "undo",
    icon() {
        return <UndoIcon />;
    },
    onClick: imageEditor => {
        imageEditor.undo();
    }
};

export default tool;
