// @flow
import React from "react";
import { ReactComponent as RotateRight } from "./icons/rotateRight.svg";
import type { ImageEditorTool } from "./types";
import { IconButton } from "webiny-ui/Button";
import { Slider } from "webiny-ui/Slider";
import { Tooltip } from "webiny-ui/Tooltip";

class SubMenu extends React.Component<*, { rangeInput: 0 }> {
    state = {
        rangeInput: 0
    };

    render() {
        const { imageEditor, clearTool, resizeCanvas } = this.props;
        return (
            <ul>
                <li
                    onClick={async () => {
                        await imageEditor.rotate(30);
                        resizeCanvas();
                    }}
                >
                    Clockwise(30)
                </li>
                <li
                    onClick={async () => {
                        await imageEditor.rotate(-30);
                        resizeCanvas();
                    }}
                >
                    Counter-Clockwise(-30)
                </li>
                <li style={{ width: 500 }}>
                    <Slider
                        label={"Range Input"}
                        value={this.state.rangeInput}
                        min={-360}
                        max={360}
                        onInput={value => {
                            this.setState({ rangeInput: value }, async () => {
                                await imageEditor.setAngle(parseInt(value, 10));
                                resizeCanvas();
                            });
                        }}
                    />
                </li>
                <li onClick={clearTool}>Apply</li>
            </ul>
        );
    }
}

const tool: ImageEditorTool = {
    name: "rotate",
    icon({ imageEditor, enableTool }) {
        return (
            <IconButton
                icon={
                    <Tooltip content={"Rotate"}>
                        <RotateRight />
                    </Tooltip>
                }
                onClick={() => {
                    enableTool();
                    imageEditor.stopDrawingMode();
                }}
            />
        );
    },
    subMenu(props) {
        return <SubMenu {...props} />;
    }
};

export default tool;
