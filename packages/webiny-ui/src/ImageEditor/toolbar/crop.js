// @flow
import React from "react";
import type { ImageEditorTool } from "./types";
import { CropIcon } from "./icons";

const subMenu = ({ imageEditor, clearTool }) => {
    return (
        <ul>
            <li
                onClick={() => {
                    imageEditor.crop(imageEditor.getCropzoneRect()).then(() => {
                        imageEditor.stopDrawingMode();
                        // resizeEditor();
                        clearTool();
                    });
                }}
            >
                Apply
            </li>
            <li
                onClick={() => {
                    imageEditor.stopDrawingMode();
                    clearTool();
                }}
            >
                Cancel
            </li>
        </ul>
    );
};

const tool: ImageEditorTool = {
    name: "crop",
    icon: <CropIcon />,
    subMenu,
    onClick: imageEditor => {
        imageEditor.startDrawingMode("CROPPER");
    }
};

export default tool;
