import React from "react";
import { Button, IconButton, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as FlipIcon } from "@webiny/icons/flip.svg";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
import type { ImageEditorTool } from "./types.js";

let cropper: Cropper;

const renderForm = () => {
    return (
        <div className={"flex justify-center gap-sm"}>
            <Button
                text={"FlipX"}
                variant={"secondary"}
                onClick={() => {
                    if (!cropper) {
                        return;
                    }
                    cropper.getCropperImage()?.$scale(-1, 1);
                }}
            />
            <Button
                text={"FlipY"}
                variant={"secondary"}
                onClick={() => {
                    if (!cropper) {
                        return;
                    }
                    cropper.getCropperImage()?.$scale(1, -1);
                }}
            />
        </div>
    );
};

const tool: ImageEditorTool = {
    name: "flip",
    icon({ activateTool }) {
        return (
            <Tooltip
                side={"bottom"}
                content={"Flip"}
                trigger={
                    <IconButton
                        variant={"ghost"}
                        icon={<FlipIcon />}
                        onClick={() => activateTool("flip")}
                        data-testid={"flip-item"}
                    />
                }
            />
        );
    },
    renderForm,
    cancel: () => cropper && cropper.destroy(),
    onActivate: ({ canvas }) => {
        cropper = new Cropper(canvas.current as HTMLCanvasElement, {
            template:
                "<cropper-canvas><cropper-image scalable translatable></cropper-image></cropper-canvas>"
        });
    },
    apply: async ({ canvas }) => {
        if (!cropper) {
            return;
        }

        const current = canvas.current;
        const flippedCanvas = await cropper.getCropperCanvas()?.$toCanvas();

        if (current && flippedCanvas) {
            const ctx = current.getContext("2d") as CanvasRenderingContext2D;
            current.width = flippedCanvas.width;
            current.height = flippedCanvas.height;
            ctx.drawImage(flippedCanvas, 0, 0);
        }

        cropper.destroy();
    }
};

export default tool;
