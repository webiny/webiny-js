// @flow
import React from "react";
import type { ImageEditorTool } from "./types";
import { CropIcon } from "./icons";
import { IconButton } from "webiny-ui/Button";

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
    icon: ({imageEditor, enableTool}) => (
        <IconButton
            icon={<CropIcon/>}
            onClick={() => {
                enableTool();
                imageEditor.startDrawingMode("CROPPER");
            }}
        />
    ),
    subMenu,
};

export default tool;
