// @flow
import React from "react";
import type { ImageEditorTool } from "./types";
import { ReactComponent as CropIcon } from "./icons/crop.svg";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

let cropper: ?Cropper = null;

const renderForm = () => {
    return (
        <div style={{ textAlign: "center" }}>
            Click and drag to crop a portion of the image. Hold Shift to persist aspect ratio.
        </div>
    );
};

const tool: ImageEditorTool = {
    name: "crop",
    icon({ activateTool }) {
        return (
            <Tooltip placement={"bottom"} content={"Crop"}>
                <IconButton icon={<CropIcon />} onClick={activateTool} />
            </Tooltip>
        );
    },
    renderForm,
    onActivate: ({ canvas, options }) => {
        cropper = new Cropper(canvas.current, options);
    },
    cancel: () => cropper && cropper.destroy(),
    apply: ({ canvas }) => {
        return new Promise(resolve => {
            if (!cropper) {
                resolve();
                return;
            }

            const current = canvas.current;
            const src = cropper.getCroppedCanvas().toDataURL();
            if (current) {
                const image = new window.Image();
                const ctx = current.getContext("2d");
                image.onload = () => {
                    ctx.drawImage(image, 0, 0);
                    current.width = image.width;
                    current.height = image.height;

                    ctx.drawImage(image, 0, 0);
                    resolve();
                };
                image.src = src;
            }

            cropper.destroy();
            cropper = null;
        });
    }
};

export default tool;
