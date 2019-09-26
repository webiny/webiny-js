// @flow
import React from "react";
import { ReactComponent as RotateRight } from "./icons/rotateRight.svg";
import type { ImageEditorTool } from "./types";
import { Slider } from "@webiny/ui/Slider";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";

import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

let cropper: ?Cropper = null;

class RenderForm extends React.Component<*, { rangeInput: 0 }> {
    state = {
        rangeInput: 0
    };

    render() {
        return (
            <div style={{ width: "500px", margin: "0 auto" }}>
                <Slider
                    label={"Range Input"}
                    value={this.state.rangeInput}
                    min={0}
                    max={360}
                    step={10}
                    discrete={true}
                    displayMarkers={true}
                    onInput={value => {
                        this.setState({ rangeInput: value }, async () => {
                            if (cropper) {
                                cropper.rotateTo(parseInt(value, 10));
                            }
                        });
                    }}
                />
            </div>
        );
    }
}

const tool: ImageEditorTool = {
    name: "rotate",
    icon({ activateTool }) {
        return (
            <Tooltip placement={"bottom"} content={"Rotate"}>
                <IconButton icon={<RotateRight />} onClick={activateTool} />
            </Tooltip>
        );
    },
    renderForm(props) {
        return <RenderForm {...props} />;
    },
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
                };
                image.src = src;
                resolve();
            }

            cropper.destroy();
        });
    }
};

export default tool;
