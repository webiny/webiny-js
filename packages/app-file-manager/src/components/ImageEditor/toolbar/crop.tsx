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
    apply: ({ canvas }) => {
        return new Promise((resolve: any) => {
            if (!cropper) {
                resolve();
                return;
            }

            const current = canvas.current;
            const src = cropper.getCroppedCanvas().toDataURL();
            if (current) {
                const image = new window.Image();
                const ctx = current.getContext("2d") as CanvasRenderingContext2D;
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
            cropper = undefined;
        });
    }
};

export default tool;
