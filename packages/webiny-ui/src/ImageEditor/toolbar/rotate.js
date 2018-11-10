// @flow
import React from "react";
import { ReactComponent as RotateRight } from "./icons/rotateRight.svg";
import type { ImageEditorTool } from "./types";
import { Slider } from "webiny-ui/Slider";
import { Tooltip } from "webiny-ui/Tooltip";
import { IconButton, ButtonDefault } from "webiny-ui/Button";

import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

let cropper: ?Cropper = null;

class SubMenu extends React.Component<*, { rangeInput: 0 }> {
    state = {
        rangeInput: 0
    };

    render() {
        const { apply, deactivateTool } = this.props;

        return (
            <React.Fragment>
                <div style={{ width: "500px" }}>
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
    }
}

const tool: ImageEditorTool = {
    name: "rotate",
    icon({ canvas, activateTool }) {
        return (
            <Tooltip placement={"bottom"} content={"Rotate"}>
                <IconButton
                    icon={<RotateRight />}
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
    subMenu(props) {
        return <SubMenu {...props} />;
    }
};

export default tool;
