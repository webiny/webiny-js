// @flow
import React from "react";
import type { ImageEditorTool } from "./types";
import { ReactComponent as CropIcon } from "./icons/crop.svg";
import { IconButton } from "webiny-ui/Button";

const subMenu = ({ imageEditor, clearTool, resizeCanvas }) => {
    return (
        <ul>
            <li
                onClick={() => {
                    imageEditor.crop(imageEditor.getCropzoneRect()).then(() => {
                        imageEditor.stopDrawingMode();
                        resizeCanvas();
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
    icon({ imageEditor, enableTool }) {
        return (
            <IconButton
                icon={<CropIcon />}
                onClick={() => {
                    enableTool();
                    imageEditor.startDrawingMode("CROPPER");
                }}
            />
        );
    },
    subMenu
};

export default tool;
