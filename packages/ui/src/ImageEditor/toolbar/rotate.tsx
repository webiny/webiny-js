import React from "react";
import { ReactComponent as RotateRight } from "./icons/rotateRight.svg";
import { ImageEditorTool } from "./types";
import { Slider } from "../../Slider";
import { Tooltip } from "~/Tooltip";
import { IconButton } from "~/Button";

import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

let cropper: Cropper;

class RenderForm extends React.Component<any, any> {
    public override state = {
        rangeInput: 0
    };

    public override render() {
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
                    onInput={(value: string) => {
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
                <IconButton
                    icon={<RotateRight />}
                    onClick={() => activateTool("rotate")}
                    data-testid={"rotate-item"}
                />
            </Tooltip>
        );
    },
    renderForm(props) {
        return <RenderForm {...props} />;
    },
    onActivate: ({ canvas }) => {
        /**
         * We can safely cast canvas.current as HTMLCanvasElement
         */
        cropper = new Cropper(canvas.current as HTMLCanvasElement, {
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
                };
                image.src = src;
                resolve();
            }

            cropper.destroy();
        });
    }
};

export default tool;
