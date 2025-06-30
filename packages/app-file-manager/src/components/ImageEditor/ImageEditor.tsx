import React from "react";
import { Button } from "@webiny/admin-ui";
import { flip, filter, crop, rotate } from "./toolbar";
import { ImageEditorTool, ToolbarTool } from "./toolbar/types";
/**
 * Package load-script does not have types.
 */
// @ts-expect-error
import loadScript from "load-script";

const toolbar = {
    flip,
    filter,
    crop,
    rotate
};

const initScripts = (): Promise<string> => {
    return new Promise((resolve: any) => {
        // @ts-expect-error
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
    render: () => React.ReactNode;
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
    onToolActivate?: () => void;
    onToolDeactivate?: () => void;
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
            <div
                className={
                    "wby-w-full wby-h-full wby-flex wby-flex-col wby-gap-md wby-overflow-hidden"
                }
            >
                <div className={"wby-flex wby-justify-center wby-items-center wby-w-full"}>
                    {tools.map(key => {
                        const tool: ImageEditorTool = toolbar[key];
                        if (!tool) {
                            return null;
                        }

                        return (
                            <div
                                key={key}
                                className={
                                    this.state.tool
                                        ? "wby-opacity-50 wby-cursor wby-pointer-events-none"
                                        : ""
                                }
                            >
                                {tool.icon({
                                    activateTool: () => this.activateTool(tool)
                                })}
                            </div>
                        );
                    })}
                </div>
                <div className={"wby-w-full"}>
                    {tool ? (
                        <>
                            {typeof tool.renderForm === "function" &&
                                tool.renderForm({
                                    options: this.getToolOptions(tool as ImageEditorTool),
                                    image: this.image as HTMLImageElement,
                                    canvas: this.canvas
                                })}

                            <div className={"wby-flex wby-justify-center wby-gap-sm wby-mt-sm"}>
                                <Button
                                    variant={"secondary"}
                                    text={"Cancel"}
                                    data-testid="button-cancel"
                                    onClick={() => {
                                        this.cancelActiveTool();
                                    }}
                                />
                                <Button
                                    variant={"primary"}
                                    text={"Apply"}
                                    data-testid="button-apply"
                                    onClick={() => {
                                        this.applyActiveTool();
                                    }}
                                />
                            </div>
                        </>
                    ) : (
                        <div className={"wby-text-center"}>
                            Select a tool to start working on your image.
                        </div>
                    )}
                </div>
                <div
                    className={
                        "wby-flex wby-justify-center wby-items-center wby-w-full wby-bg-neutral-dimmed wby-rounded-md wby-overflow-hidden"
                    }
                    style={{ height: "calc(100vh - 256px)" }}
                >
                    <canvas
                        key={src}
                        id={"canvas"}
                        style={{ maxWidth: "100%", maxHeight: "100%" }}
                        ref={this.canvas as React.Ref<any>}
                    />
                </div>
            </div>
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
