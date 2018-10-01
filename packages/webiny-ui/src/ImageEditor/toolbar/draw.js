// @flow
import React from "react";
import type { ImageEditorTool, ImageEditor } from "./types";
import { ReactComponent as DrawIcon } from "./icons/draw.svg";

import ReactColor from "react-color";
import { IconButton } from "webiny-ui/Button";
import { Slider } from "webiny-ui/Slider";
import { Radio } from "webiny-ui/Radio";
import { Tooltip } from "webiny-ui/Tooltip";

type Props = { imageEditor: ImageEditor, clearTool: Function };
type State = {
    brush: {
        type: "free" | "line",
        color: {
            object: {},
            string: ""
        },
        width: number
    }
};

class SubMenu extends React.Component<Props, State> {
    state = {
        brush: {
            type: "free",
            color: {
                object: {},
                string: ""
            },
            width: 5
        }
    };

    render() {
        const { imageEditor, clearTool } = this.props;
        return (
            <ul>
                <li>
                    <Radio
                        value={this.state.brush.type === "free"}
                        label={"Free drawing"}
                        onChange={() => {
                            this.setState(
                                state => {
                                    state.brush.type = "free";
                                    return state;
                                },
                                () => {
                                    const { color, width } = this.state.brush;
                                    imageEditor.startDrawingMode("FREE_DRAWING", {
                                        color: color.string,
                                        width
                                    });
                                }
                            );
                        }}
                    />

                    <Radio
                        value={this.state.brush.type === "line"}
                        label={"Straight line"}
                        onChange={() => {
                            this.setState(
                                state => {
                                    state.brush.type = "line";
                                    return state;
                                },
                                () => {
                                    const { color, width } = this.state.brush;
                                    imageEditor.startDrawingMode("LINE_DRAWING", {
                                        color: color.string,
                                        width
                                    });
                                }
                            );
                        }}
                    />
                </li>
                <li>
                    <ReactColor
                        color={this.state.brush.color.object}
                        onChange={color => {
                            console.log(color);
                            const { r, g, b, a } = color.rgb;
                            const string = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";

                            this.setState(
                                state => {
                                    state.brush.color = {
                                        object: { r, g, b, a },
                                        string
                                    };
                                    return state;
                                },
                                () => {
                                    const { color, width } = this.state.brush;
                                    imageEditor.setBrush({ width, color: color.string });
                                }
                            );
                        }}
                    />
                </li>
                <li>
                    <Slider
                        label={"Brush width"}
                        value={this.state.brush.width}
                        min={5}
                        max={30}
                        onInput={value => {
                            this.setState(
                                state => {
                                    state.brush.width = parseInt(value);
                                    return state;
                                },
                                () => {
                                    const { color, width } = this.state.brush;
                                    imageEditor.setBrush({ width, color: color.string });
                                }
                            );
                        }}
                    />
                </li>
                <li onClick={clearTool}>Close</li>
            </ul>
        );
    }
}

const tool: ImageEditorTool = {
    name: "draw",
    icon({ imageEditor, enableTool }) {
        return (
            <IconButton
                icon={
                    <Tooltip content={"Draw"}>
                        <DrawIcon />
                    </Tooltip>
                }
                onClick={() => {
                    enableTool();
                    imageEditor.startDrawingMode("FREE_DRAWING");
                }}
            />
        );
    },
    subMenu(props) {
        return <SubMenu {...props} />;
    }
};

export default tool;
