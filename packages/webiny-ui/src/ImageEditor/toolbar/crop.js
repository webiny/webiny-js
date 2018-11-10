// @flow
import React from "react";
import type { ImageEditorTool } from "./types";
import { ReactComponent as CropIcon } from "./icons/crop.svg";
import { IconButton, ButtonDefault } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

let cropper: ?Cropper = null;

const subMenu = ({ apply, deactivateTool }) => {
    return (
        <React.Fragment>
            <div>Click and drag to crop a portion of the image. Hold Shift to crop a square.</div>
            <div>
                <ButtonDefault
                    onClick={() => {
                        if (cropper) {
                            apply(cropper.getCroppedCanvas().toDataURL());
                            cropper.destroy();
                            deactivateTool();
                        }
                    }}
                >
                    Apply
                </ButtonDefault>
                <ButtonDefault
                    onClick={() => {
                        if (cropper) {
                            cropper.destroy();
                            deactivateTool();
                        }
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
    icon(props) {
        return (
            <Tooltip placement={"bottom"} content={"Crop"}>
                <IconButton
                    icon={<CropIcon />}
                    onClick={() => {
                        cropper = new Cropper(props.canvas.current);
                        props.activateTool();
                    }}
                />
            </Tooltip>
        );
    },
    subMenu
};

export default tool;
