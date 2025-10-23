import React from "react";
import { Button, IconButton, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as FlipIcon } from "@webiny/icons/flip.svg";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
import type { ImageEditorTool } from "./types.js";

let cropper: Cropper;

const flipped = { x: 1, y: 1 };

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

                    flipped.x = flipped.x === 1 ? -1 : 1;
                    cropper.scaleX(flipped.x);
                }}
            />
            <Button
                text={"FlipY"}
                variant={"secondary"}
                onClick={() => {
                    if (!cropper) {
                        return;
                    }

                    flipped.y = flipped.y === 1 ? -1 : 1;
                    cropper.scaleY(flipped.y);
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
            background: false,
            modal: false,
            guides: false,
            dragMode: "none",
            highlight: false,
            autoCrop: false
        });
    },
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
        });
    }
};

export default tool;
