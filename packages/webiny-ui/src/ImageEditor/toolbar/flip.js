// @flow
import React from "react";
import type { ImageEditorTool } from "./types";
import { ReactComponent as FlipIcon } from "./icons/flip.svg";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

import { IconButton, ButtonDefault } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";

let cropper: ?Cropper = null;

const subMenu = ({ apply, deactivateTool }) => {
    return (
        <React.Fragment>
            <div>
                <ButtonDefault onClick={() => cropper && cropper.scale(-1, 1)}>FlipX</ButtonDefault>
                <ButtonDefault onClick={() => cropper && cropper.scale(1, -1)}>FlipY</ButtonDefault>
            </div>
            <div>
                <ButtonDefault
                    onClick={() => {
                        if (cropper) {
                            apply(cropper.getCroppedCanvas().toDataURL());
                            cropper.destroy();
                            cropper = null;
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
                            cropper = null;
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
    name: "flip",
    icon({ canvas, activateTool }) {
        return (
            <Tooltip placement={"bottom"} content={"Flip"}>
                <IconButton
                    icon={<FlipIcon />}
                    onClick={() => {
                        cropper = new Cropper(canvas.current, {
                            background: false,
                            modal: false,
                            guides: false,
                            dragMode: "none",
                            highlight: false,
                            autoCrop: false
                        });
                        activateTool();
                    }}
                />
            </Tooltip>
        );
    },
    subMenu
};

export default tool;
