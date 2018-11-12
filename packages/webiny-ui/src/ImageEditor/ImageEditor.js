// @flow
import * as React from "react";
import * as toolbar from "./toolbar";
import type { ImageEditorTool } from "./toolbar/types";
import styled from "react-emotion";
import classNames from "classnames";
import { ButtonDefault } from "webiny-ui/Button";
import loadScript from "load-script";

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
    margin: "0 -24px 10px -24px",
    boxSizing: "border-box",
    padding: 10,
    backgroundColor: "var(--mdc-theme-background)",
    borderTop: "1px solid var(--mdc-theme-on-background)"
});

const ApplyCancelActions = styled("div")({
    textAlign: "center"
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

const initScripts = () => {
    return new Promise(resolve => {
        if (window.Caman) {
            return resolve();
        }
        return loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/camanjs/4.1.2/caman.full.min.js",
            resolve
        );
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
    image = null;
    componentDidMount() {
        initScripts().then(() => {
            readFileContent(this.props.src).then(src => {
                this.image = new window.Image();
                const canvas = this.canvas.current;
                if (canvas) {
                    this.image.onload = () => {
                        if (this.image) {
                            const ctx = canvas.getContext("2d");
                            canvas.width = this.image.width;
                            canvas.height = this.image.height;

                            ctx.drawImage(this.image, 0, 0);
                        }
                    };

                    this.image.src = src;
                }
            });
        });
    }

    activateTool = (tool: ImageEditorTool) => {
        const { onToolActivate } = this.props;
        this.setState({ tool }, () => {
            onToolActivate && onToolActivate();
        });
    };

    deactivateTool = () => {
        const { onToolDeactivate } = this.props;

        this.setState({ tool: null }, () => {
            onToolDeactivate && onToolDeactivate();
        });
    };

    render() {
        const { tools, onChange } = this.props;
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
                                    activateTool: () => this.activateTool(tool)
                                })}
                            </div>
                        );
                    })}
                </Toolbar>

                <ToolOptions>
                    {this.state.tool &&
                        typeof this.state.tool.renderForm === "function" &&
                        this.state.tool.renderForm({
                            image: this.image,
                            canvas: this.canvas,
                            renderApplyCancel: ({ onApply, onCancel }) => (
                                <ApplyCancelActions>
                                    <ButtonDefault
                                        onClick={async () => {
                                            onApply && (await onApply());
                                            const canvas = this.canvas.current;
                                            if (canvas) {
                                                onChange && onChange(canvas.toDataURL());
                                            }
                                            this.deactivateTool();
                                        }}
                                    >
                                        Apply
                                    </ButtonDefault>
                                    <ButtonDefault
                                        onClick={() => {
                                            onCancel && onCancel();
                                            this.deactivateTool();
                                        }}
                                    >
                                        Cancel
                                    </ButtonDefault>
                                </ApplyCancelActions>
                            )
                        })}
                    {!this.state.tool && (
                        <div style={{ textAlign: "center" }}>
                            Select a tool to start working on your image.
                        </div>
                    )}
                </ToolOptions>

                <div style={{ margin: "0 auto", textAlign: "center" }}>
                    <canvas id={"canvas"} style={{ maxWidth: 500 }} ref={this.canvas} />
                </div>
            </React.Fragment>
        );
    }
}

export { ImageEditor };
