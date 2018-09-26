// @flow
import React from "react";
import type { ImageEditorTool, ImageEditor } from "./types";
import { DrawIcon } from "./icons";
import ReactColor from "react-color";

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
                    <label>
                        <input
                            checked={this.state.brush.type === "free"}
                            type="radio"
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
                        Free drawing
                    </label>
                    <label>
                        <input
                            checked={this.state.brush.type === "line"}
                            type="radio"
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
                        Straight line
                    </label>
                </li>
                <li>
                    <ReactColor
                        color={this.state.brush.color.object}
                        onChange={color => {
                            const { r, g, b, a } = color.rgb;
                            const string = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";

                            this.setState(
                                state => {
                                    state.brush.color = {
                                        object: color,
                                        string
                                    };
                                    return state;
                                },
                                () => {
                                    imageEditor.setBrush({
                                        color: string
                                    });
                                }
                            );
                        }}
                    />
                </li>
                <li>
                    <label>
                        Brush width
                        <input
                            type="range"
                            min={5}
                            max={30}
                            value={this.state.brush.width}
                            onChange={e => {
                                const { value } = e.target;
                                this.setState(
                                    state => {
                                        state.brush.width = value;
                                        return state;
                                    },
                                    imageEditor.setBrush({
                                        width: parseInt(value)
                                    })
                                );
                            }}
                        />
                    </label>
                </li>
                <li onClick={clearTool}>Close</li>
            </ul>
        );
    }
}

const tool: ImageEditorTool = {
    name: "draw",
    icon: <DrawIcon />,
    subMenu(props) {
        return <SubMenu {...props} />;
    },
    onClick: imageEditor => {
        imageEditor.startDrawingMode("FREE_DRAWING");
    }
};

export default tool;
