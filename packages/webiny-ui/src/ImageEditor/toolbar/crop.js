// @flow
import React from "react";
import type { ImageEditorTool } from "./types";
import { ReactComponent as CropIcon } from "./icons/crop.svg";
import { IconButton, ButtonDefault } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";

const subMenu = ({ imageEditor, clearTool, resizeCanvas }) => {
    return (
        <React.Fragment>
            <div>Click and drag to crop a portion of the image. Hold Shift to crop a square.</div>
            <div>
                <ButtonDefault
                    onClick={() => {
                        imageEditor.crop(imageEditor.getCropzoneRect()).then(() => {
                            imageEditor.stopDrawingMode();
                            resizeCanvas();
                            clearTool();
                        });
                    }}
                >
                    Apply
                </ButtonDefault>
                <ButtonDefault
                    onClick={() => {
                        imageEditor.stopDrawingMode();
                        clearTool();
                    }}
                >
                    Cancel
                </ButtonDefault>
            </div>
        </React.Fragment>
    );
};

const tool: ImageEditorTool = {
    name: "crop",
    icon({ imageEditor, enableTool }) {
        return (
            <Tooltip placement={"bottom"} content={"Crop"}>
                <IconButton
                    icon={<CropIcon />}
                    onClick={() => {
                        enableTool();
                        imageEditor.startDrawingMode("CROPPER");
                    }}
                />
            </Tooltip>
        );
    },
    subMenu
};

export default tool;
