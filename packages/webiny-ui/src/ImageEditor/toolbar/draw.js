// @flow
import React from "react";
import type { ImageEditorTool, ImageEditor } from "./types";
import { ReactComponent as DrawIcon } from "./icons/draw.svg";

import ReactColor from "react-color";
import { IconButton } from "webiny-ui/Button";
import { Slider } from "webiny-ui/Slider";
import { Radio, RadioGroup } from "webiny-ui/Radio";
import { Tooltip } from "webiny-ui/Tooltip";
import styled from "react-emotion";

type Props = { imageEditor: ImageEditor, clearTool: Function };
type State = {
    brush: {
        type: "FREE_DRAWING" | "LINE_DRAWING",
        color: {
            object: {},
            string: string,
            pickerOpen: boolean
        },
        width: number
    }
};

const ColorPickerIcon = styled("div")({
    width: "36px",
    height: "18px",
    borderRadius: "2px",
    margin: "15px 0",
    boxSizing: "border-box"
});

const ColorPickerPopover = styled("div")({
    position: "absolute",
    zIndex: "2",
    ".cover": {
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    }
});

class SubMenu extends React.Component<Props, State> {
    state = {
        brush: {
            type: "FREE_DRAWING",
            color: {
                pickerOpen: false,
                object: {
                    r: 255,
                    g: 0,
                    b: 0,
                    a: 1
                },
                string: "rgba(255, 0, 0, 1)"
            },
            width: 5
        }
    };

    componentDidMount() {
        const { imageEditor } = this.props;
        const { color, width } = this.state.brush;
        imageEditor.setBrush({ width, color: color.string });
    }

    render() {
        const { imageEditor } = this.props;

        return (
            <React.Fragment>
                <div>
                    <RadioGroup label="Style">
                        {() => (
                            <React.Fragment>
                                <Radio
                                    value={this.state.brush.type === "FREE_DRAWING"}
                                    label={"Free drawing"}
                                    onChange={() => {
                                        this.setState(
                                            state => {
                                                state.brush.type = "FREE_DRAWING";
                                                return state;
                                            },
                                            () => {
                                                imageEditor.stopDrawingMode();
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
                                    value={this.state.brush.type === "LINE_DRAWING"}
                                    label={"Straight line"}
                                    onChange={() => {
                                        this.setState(
                                            state => {
                                                state.brush.type = "LINE_DRAWING";
                                                return state;
                                            },
                                            () => {
                                                imageEditor.stopDrawingMode();
                                                const { color, width } = this.state.brush;
                                                imageEditor.startDrawingMode("LINE_DRAWING", {
                                                    color: color.string,
                                                    width
                                                });
                                            }
                                        );
                                    }}
                                />
                            </React.Fragment>
                        )}
                    </RadioGroup>
                </div>
                <div>
                    <div className="mdc-text-field-helper-text mdc-text-field-helper-text--persistent">
                        Color
                    </div>
                    <ColorPickerIcon
                        style={{ background: this.state.brush.color.string }}
                        onClick={() =>
                            this.setState(state => {
                                state.brush.color.pickerOpen = true;
                                return state;
                            })
                        }
                    />

                    {this.state.brush.color.pickerOpen && (
                        <ColorPickerPopover>
                            <div
                                className="cover"
                                onClick={() => {
                                    this.setState(state => {
                                        state.brush.color.pickerOpen = false;
                                        return state;
                                    });
                                }}
                            />
                            <ReactColor
                                onClose
                                color={this.state.brush.color.object}
                                onChange={color => {
                                    const { r, g, b, a } = color.rgb;
                                    const string =
                                        "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";

                                    this.setState(
                                        state => {
                                            state.brush.color = {
                                                object: { r, g, b, a },
                                                string,
                                                pickerOpen: true
                                            };
                                            return state;
                                        },
                                        () => {
                                            imageEditor.stopDrawingMode();
                                            const { color, width, type } = this.state.brush;
                                            imageEditor.startDrawingMode(type, {
                                                color: color.string,
                                                width
                                            });
                                        }
                                    );
                                }}
                            />
                        </ColorPickerPopover>
                    )}
                </div>
                <div>
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
                                    imageEditor.stopDrawingMode();
                                    const { color, width, type } = this.state.brush;
                                    imageEditor.startDrawingMode(type, {
                                        color: color.string,
                                        width
                                    });
                                }
                            );
                        }}
                    />
                </div>
            </React.Fragment>
        );
    }
}

const tool: ImageEditorTool = {
    name: "draw",
    icon({ imageEditor, enableTool }) {
        return (
            <Tooltip placement={"bottom"} content={"Draw"}>
                <IconButton
                    icon={<DrawIcon />}
                    onClick={() => {
                        enableTool();
                        imageEditor.startDrawingMode("FREE_DRAWING");
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
