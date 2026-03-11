import React from "react";
import type { ImageEditorTool } from "./types.js";
import { IconButton, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as CropIcon } from "@webiny/icons/crop.svg";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

let cropper: Cropper | undefined = undefined;

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
            <Tooltip
                side={"bottom"}
                content={"Crop"}
                trigger={
                    <IconButton
                        variant={"ghost"}
                        icon={<CropIcon />}
                        onClick={() => activateTool("crop")}
                        data-testid={"crop-item"}
                    />
                }
            />
        );
    },
    renderForm,
    onActivate: ({ canvas, options }) => {
        cropper = new Cropper(canvas.current!, options);
    },
    cancel: () => cropper && cropper.destroy(),
    apply: async ({ canvas }) => {
        if (!cropper) {
            return;
        }

        const current = canvas.current;
        const croppedCanvas = await cropper.getCropperSelection()?.$toCanvas();

        if (current && croppedCanvas) {
            const ctx = current.getContext("2d") as CanvasRenderingContext2D;
            current.width = croppedCanvas.width;
            current.height = croppedCanvas.height;
            ctx.drawImage(croppedCanvas, 0, 0);
        }

        cropper.destroy();
        cropper = undefined;
    }
};

export default tool;
