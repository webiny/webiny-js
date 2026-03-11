import React from "react";
import { IconButton, Slider, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as RotateRight } from "@webiny/icons/rotate_right.svg";
import type { ImageEditorTool } from "./types.js";

import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

let cropper: Cropper;
let prevAngle = 0;

class RenderForm extends React.Component<any, any> {
    public override state = {
        rangeInput: 0
    };

    public override render() {
        return (
            <div>
                <Slider
                    label={"Range Input"}
                    value={Number(this.state.rangeInput)}
                    min={0}
                    max={360}
                    step={10}
                    onValueChange={(value: number) => {
                        this.setState({ rangeInput: value }, async () => {
                            if (cropper) {
                                const delta = value - prevAngle;
                                prevAngle = value;
                                cropper.getCropperImage()?.$rotate(`${delta}deg`);
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
            <Tooltip
                side={"bottom"}
                content={"Rotate"}
                trigger={
                    <IconButton
                        variant={"ghost"}
                        icon={<RotateRight />}
                        onClick={() => activateTool("rotate")}
                        data-testid={"rotate-item"}
                    />
                }
            />
        );
    },
    renderForm(props) {
        return <RenderForm {...props} />;
    },
    onActivate: ({ canvas }) => {
        prevAngle = 0;
        /**
         * We can safely cast canvas.current as HTMLCanvasElement.
         */
        cropper = new Cropper(canvas.current as HTMLCanvasElement, {
            template:
                "<cropper-canvas><cropper-image rotatable translatable></cropper-image></cropper-canvas>"
        });
    },
    cancel: () => cropper && cropper.destroy(),
    apply: async ({ canvas }) => {
        if (!cropper) {
            return;
        }

        const current = canvas.current;
        const rotatedCanvas = await cropper.getCropperCanvas()?.$toCanvas();

        if (current && rotatedCanvas) {
            const ctx = current.getContext("2d") as CanvasRenderingContext2D;
            current.width = rotatedCanvas.width;
            current.height = rotatedCanvas.height;
            ctx.drawImage(rotatedCanvas, 0, 0);
        }

        cropper.destroy();
    }
};

export default tool;
