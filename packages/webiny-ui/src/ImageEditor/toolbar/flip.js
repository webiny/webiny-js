// @flow
import React from "react";
import type { ImageEditorTool } from "./types";
import { ReactComponent as FlipIcon } from "./icons/flip.svg";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

import { IconButton, ButtonDefault } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";

let cropper: ?Cropper = null;

const flipped = { x: 1, y: 1 };

const renderForm = () => {
    return (
        <div style={{ textAlign: "center" }}>
            <ButtonDefault
                onClick={() => {
                    if (!cropper) {
                        return;
                    }

                    flipped.x = flipped.x === 1 ? -1 : 1;
                    cropper.scaleX(flipped.x);
                }}
            >
                FlipX
            </ButtonDefault>
            <ButtonDefault
                onClick={() => {
                    if (!cropper) {
                        return;
                    }

                    flipped.y = flipped.y === 1 ? -1 : 1;
                    cropper.scaleY(flipped.y);
                }}
            >
                FlipY
            </ButtonDefault>
        </div>
    );
};

const tool: ImageEditorTool = {
    name: "flip",
    icon({ activateTool }) {
        return (
            <Tooltip placement={"bottom"} content={"Flip"}>
                <IconButton icon={<FlipIcon />} onClick={activateTool} />
            </Tooltip>
        );
    },
    renderForm,
    cancel: () => cropper && cropper.destroy(),
    onActivate: ({ canvas }) => {
        cropper = new Cropper(canvas.current, {
            background: false,
            modal: false,
            guides: false,
            dragMode: "none",
            highlight: false,
            autoCrop: false
        });
    },
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
        });
    }
};

export default tool;
