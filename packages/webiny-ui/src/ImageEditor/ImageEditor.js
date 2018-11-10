// @flow
import * as React from "react";
import * as toolbar from "./toolbar";
import type { ImageEditorTool } from "./toolbar/types";
import styled from "react-emotion";
import classNames from "classnames";

export type ToolbarTool = "crop" | "flip" | "rotate" | "filter";

type Props = {
    src: string,
    onChange: ?Function,
    tools: Array<ToolbarTool>,
    onToolActivate?: Function,
    onToolDeactivate?: Function
};

type State = {
    tool: ?Object,
    src: string
};

const Toolbar = styled("div")({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "var(--mdc-theme-secondary)",
    margin: "-20px -24px 0px -24px",
    padding: 2,
    "> div.disabled": {
        opacity: 0.5,
        pointerEvents: "none"
    }
});

const ToolOptions = styled("div")({
    display: "flex",
    justifyContent: "space-evenly",
    alignItems: "center",
    margin: "0 -24px 10px -24px",
    boxSizing: "border-box",
    padding: 10,
    backgroundColor: "var(--mdc-theme-background)",
    borderTop: "1px solid var(--mdc-theme-on-background)",
    flexGrow: 1,
    flexBasis: 0
});

const readFileContent = async file => {
    return new Promise(resolve => {
        const reader = new window.FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };

        reader.readAsDataURL(file);
    });
};

class ImageEditor extends React.Component<Props, State> {
    static defaultProps = {
        tools: ["crop", "flip", "rotate", "filter"],
        onChange: null
    };

    state = {
        tool: null,
        src: ""
    };

    canvas = React.createRef();

    componentDidMount() {
        readFileContent(this.props.src).then(src => {
            const image = new Image();
            const canvas = this.canvas.current;
            if (canvas) {
                image.onload = () => {
                    const ctx = canvas.getContext("2d");
                    canvas.width = image.width;
                    canvas.height = image.height;

                    ctx.drawImage(image, 0, 0);
                };

                image.src = src;
            }
        });
    }

    render() {
        const { tools, onToolActivate, onToolDeactivate } = this.props;

        return (
            <React.Fragment>
                <Toolbar>
                    {tools.map(key => {
                        const tool: ?ImageEditorTool = toolbar[key];
                        if (!tool) {
                            return null;
                        }

                        return (
                            <div key={key} className={classNames({ disabled: this.state.tool })}>
                                {tool.icon({
                                    canvas: this.canvas,
                                    apply: () => {
                                        console.log("idees miki");
                                    },
                                    activateTool: () => {
                                        this.setState({ tool }, () => {
                                            onToolActivate && onToolActivate();
                                        });
                                    }
                                })}
                            </div>
                        );
                    })}
                </Toolbar>

                <ToolOptions>
                    {this.state.tool &&
                        typeof this.state.tool.subMenu === "function" &&
                        this.state.tool.subMenu({
                            apply: src => {
                                const current = this.canvas.current;

                                if (current) {
                                    const image = new Image();
                                    const ctx = current.getContext("2d");
                                    image.onload = () => {
                                        ctx.drawImage(image, 0, 0);
                                        current.width = image.width;
                                        current.height = image.height;

                                        ctx.drawImage(image, 0, 0);
                                    };
                                    image.src = src;
                                }
                            },
                            canvas: this.canvas,
                            deactivateTool: () => {
                                this.setState({ tool: null }, () => {
                                    onToolDeactivate && onToolDeactivate();
                                });
                            }
                        })}
                    {!this.state.tool && (
                        <React.Fragment>
                            {"Select a tool to start working on your image."}
                        </React.Fragment>
                    )}
                </ToolOptions>

                <div style={{ margin: "0 auto", textAlign: "center" }}>
                    <canvas style={{ maxWidth: 500 }} ref={this.canvas} />
                </div>
            </React.Fragment>
        );
    }
}

export { ImageEditor };
