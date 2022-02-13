import * as React from "react";
import { flip, filter, crop, rotate } from "./toolbar";
import { ImageEditorTool, ToolbarTool } from "./toolbar/types";
import styled from "@emotion/styled";
import classNames from "classnames";
import { ButtonSecondary, ButtonPrimary } from "../Button";
/**
 * Package load-script does not have types.
 */
// @ts-ignore
import loadScript from "load-script";

const toolbar = {
    flip,
    filter,
    crop,
    rotate
};

const Toolbar = styled("div")({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "var(--mdc-theme-secondary)",
    margin: "-24px -24px 0px -24px",
    padding: 2,
    position: "absolute",
    width: "100%",
    boxSizing: "border-box",
    zIndex: 10,
    "> div.disabled": {
        opacity: 0.5,
        pointerEvents: "none"
    }
});

const ToolOptions = styled("div")({
    margin: "50px -24px 10px -24px",
    boxSizing: "border-box",
    padding: 10,
    backgroundColor: "var(--mdc-theme-background)",
    borderTop: "1px solid var(--mdc-theme-on-background)"
});

const ApplyCancelActions = styled("div")({
    textAlign: "center"
});

const initScripts = () => {
    return new Promise((resolve: any) => {
        // @ts-ignore
        if (window.Caman) {
            return resolve();
        }
        return loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/camanjs/4.1.2/caman.full.min.js",
            resolve
        );
    });
};

interface RenderPropArgs {
    render: Function;
    getCanvasDataUrl: () => string;
    activeTool?: ImageEditorTool;
    applyActiveTool: Function;
    cancelActiveTool: Function;
}

interface PropsOptions {
    autoEnable: boolean;
}

interface Props {
    src: string;
    tools: ToolbarTool[];
    options?: {
        flip: PropsOptions;
        filter: PropsOptions;
        crop: PropsOptions;
        rotate: PropsOptions;
    };
    onToolActivate?: Function;
    onToolDeactivate?: Function;
    children?: (props: RenderPropArgs) => React.ReactNode;
}

interface State {
    tool?: ImageEditorTool;
    src: string;
}

class ImageEditor extends React.Component<Props, State> {
    static defaultProps: Partial<Props> = {
        tools: ["crop", "flip", "rotate", "filter"]
    };

    state: State = {
        tool: null,
        src: ""
    };

    public canvas = React.createRef<HTMLCanvasElement>();
    public image: HTMLImageElement = null;

    componentDidMount() {
        initScripts().then(() => {
            this.updateCanvas();
            setTimeout(() => {
                const { options } = this.props;
                if (!options || typeof options !== "object") {
                    return;
                }
                for (const key in options) {
                    const option = options[key as ToolbarTool];
                    if (option.autoEnable === true) {
                        const tool: ImageEditorTool | null = toolbar[key as ToolbarTool];
                        tool && this.activateTool(tool);
                        break;
                    }
                }
            }, 250);
        });
    }

    updateCanvas = () => {
        const { src } = this.props;
        this.image = new window.Image();
        const canvas = this.canvas.current;
        if (canvas) {
            this.image.onload = () => {
                if (this.image) {
                    canvas.width = this.image.width;
                    canvas.height = this.image.height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(this.image, 0, 0);
                }
            };

            this.image.src = src;
        }
    };

    activateTool = (tool: ToolbarTool | ImageEditorTool) => {
        if (typeof tool === "string") {
            tool = toolbar[tool];
        }

        this.setState({ tool }, () => {
            const tt = tool as ImageEditorTool;
            typeof tt.onActivate === "function" &&
                tt.onActivate({ canvas: this.canvas, options: this.getToolOptions(tt) });
        });
    };

    deactivateTool = () => {
        this.setState({ tool: null });
    };

    getCanvasDataUrl = () => {
        const canvas = this.canvas.current as HTMLCanvasElement;
        if (canvas) {
            const { src } = this.props;
            if (src.startsWith("data:image/jpeg;")) {
                return canvas.toDataURL("image/jpeg", 1.0);
            }

            return canvas.toDataURL();
        }

        return "";
    };

    applyActiveTool = async () => {
        const { tool } = this.state;
        if (!tool) {
            return;
        }

        tool.apply &&
            (await tool.apply({
                canvas: this.canvas
            }));
        this.deactivateTool();
    };

    cancelActiveTool = async () => {
        const { tool } = this.state;
        if (!tool) {
            return;
        }

        tool.cancel &&
            (await tool.cancel({
                canvas: this.canvas
            }));
        this.deactivateTool();
    };

    getToolOptions = (tool: ImageEditorTool) => {
        const { options } = this.props;
        if (!options || typeof options !== "object") {
            return {};
        }

        return options[tool.name as ToolbarTool] || {};
    };

    render() {
        const { src, tools, children } = this.props;
        const { tool } = this.state;
        const editor = (
            <React.Fragment>
                <Toolbar>
                    {tools.map(key => {
                        const tool: ImageEditorTool = toolbar[key];
                        if (!tool) {
                            return null;
                        }

                        return (
                            <div key={key} className={classNames({ disabled: this.state.tool })}>
                                {tool.icon({
                                    activateTool: () => this.activateTool(tool)
                                })}
                            </div>
                        );
                    })}
                </Toolbar>

                <ToolOptions>
                    {tool ? (
                        <>
                            {typeof tool.renderForm === "function" &&
                                tool.renderForm({
                                    options: this.getToolOptions(tool as ImageEditorTool),
                                    image: this.image,
                                    canvas: this.canvas
                                })}

                            <ApplyCancelActions>
                                <ButtonSecondary onClick={this.cancelActiveTool}>
                                    Cancel
                                </ButtonSecondary>
                                &nbsp;
                                <ButtonPrimary onClick={this.applyActiveTool}>Apply</ButtonPrimary>
                            </ApplyCancelActions>
                        </>
                    ) : (
                        <div style={{ textAlign: "center" }}>
                            Select a tool to start working on your image.
                        </div>
                    )}
                </ToolOptions>

                <div style={{ margin: "0 auto", textAlign: "center" }}>
                    <canvas
                        key={src}
                        id={"canvas"}
                        style={{ maxWidth: 700 }}
                        ref={this.canvas as React.Ref<any>}
                    />
                </div>
            </React.Fragment>
        );

        if (typeof children === "function") {
            return children({
                render: () => editor,
                // canvas: this.canvas,
                getCanvasDataUrl: this.getCanvasDataUrl,
                activeTool: this.state.tool,
                applyActiveTool: this.applyActiveTool,
                cancelActiveTool: this.cancelActiveTool
            });
        }

        return editor;
    }
}

export { ImageEditor };
