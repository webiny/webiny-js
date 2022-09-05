import React from "react";
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

const initScripts = (): Promise<string> => {
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
    activeTool: ImageEditorTool | null;
    applyActiveTool: () => Promise<void>;
    cancelActiveTool: () => Promise<void>;
}

interface ImageEditorPropsPropsOptions {
    autoEnable: boolean;
}

interface ImageEditorProps {
    src: string;
    tools: ToolbarTool[];
    options?: {
        flip: ImageEditorPropsPropsOptions;
        filter: ImageEditorPropsPropsOptions;
        crop: ImageEditorPropsPropsOptions;
        rotate: ImageEditorPropsPropsOptions;
    };
    onToolActivate?: Function;
    onToolDeactivate?: Function;
    children?: (props: RenderPropArgs) => React.ReactNode;
}

interface ImageEditorState {
    tool: ImageEditorTool | null;
    src: string;
}

class ImageEditor extends React.Component<ImageEditorProps, ImageEditorState> {
    static defaultProps: Partial<ImageEditorProps> = {
        tools: ["crop", "flip", "rotate", "filter"]
    };

    public override state: ImageEditorState = {
        tool: null,
        src: ""
    };

    public canvas = React.createRef<HTMLCanvasElement>();
    public image?: HTMLImageElement;

    public override componentDidMount() {
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

    private readonly updateCanvas = (): void => {
        const { src } = this.props;
        this.image = new window.Image();
        const canvas = this.canvas.current;
        if (canvas) {
            this.image.onload = () => {
                if (this.image) {
                    canvas.width = this.image.width;
                    canvas.height = this.image.height;
                    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
                    ctx.drawImage(this.image, 0, 0);
                }
            };

            this.image.src = src;
        }
    };

    private readonly activateTool = (tool: ToolbarTool | ImageEditorTool): void => {
        if (typeof tool === "string") {
            tool = toolbar[tool];
        }

        this.setState({ tool }, () => {
            const tt = tool as ImageEditorTool;
            typeof tt.onActivate === "function" &&
                tt.onActivate({ canvas: this.canvas, options: this.getToolOptions(tt) });
        });
    };

    private readonly deactivateTool = (): void => {
        this.setState({
            tool: null
        });
    };

    public readonly getCanvasDataUrl = (): string => {
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

    private readonly applyActiveTool = async (): Promise<void> => {
        const { tool } = this.state;
        if (!tool) {
            return;
        }

        if (tool.apply) {
            await tool.apply({
                canvas: this.canvas
            });
        }
        this.deactivateTool();
    };

    private readonly cancelActiveTool = async (): Promise<void> => {
        const { tool } = this.state;
        if (!tool) {
            return;
        }

        if (tool.cancel) {
            await tool.cancel({
                canvas: this.canvas
            });
        }
        this.deactivateTool();
    };

    private readonly getToolOptions = (
        tool: ImageEditorTool
    ): Partial<ImageEditorPropsPropsOptions> => {
        const { options } = this.props;
        if (!options || typeof options !== "object") {
            return {};
        }

        return options[tool.name as ToolbarTool] || {};
    };

    public override render(): React.ReactNode {
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
                                    image: this.image as HTMLImageElement,
                                    canvas: this.canvas
                                })}

                            <ApplyCancelActions>
                                <ButtonSecondary
                                    data-testid="button-cancel"
                                    onClick={() => {
                                        this.cancelActiveTool();
                                    }}
                                >
                                    Cancel
                                </ButtonSecondary>
                                &nbsp;
                                <ButtonPrimary
                                    data-testid="button-apply"
                                    onClick={() => {
                                        this.applyActiveTool();
                                    }}
                                >
                                    Apply
                                </ButtonPrimary>
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
