// @flow
import React from "react";
import { ReactComponent as RotateRight } from "./icons/rotateRight.svg";
import type { ImageEditorTool } from "./types";
import { IconButton, ButtonDefault } from "webiny-ui/Button";
import { Slider } from "webiny-ui/Slider";
import { Tooltip } from "webiny-ui/Tooltip";

class SubMenu extends React.Component<*, { rangeInput: 0 }> {
    state = {
        rangeInput: 0
    };

    render() {
        const { imageEditor, clearTool, resizeCanvas } = this.props;
        return (
            <React.Fragment>
                <div style={{ width: '500px' }}>
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
                                await imageEditor.setAngle(parseInt(value, 10));
                                resizeCanvas();
                            });
                        }}
                    />
                </div>
            </React.Fragment>
        );
    }
}

const tool: ImageEditorTool = {
    name: "rotate",
    icon({ imageEditor, enableTool }) {
        return (
            <Tooltip placement={"bottom"} content={"Rotate"}>
                <IconButton
                    icon={<RotateRight />}
                    onClick={() => {
                        enableTool();
                        imageEditor.stopDrawingMode();
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
