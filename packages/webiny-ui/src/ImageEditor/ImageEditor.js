// @flow
import * as React from "react";
import * as toolbar from "./toolbar";
import TuiImageEditor from "tui-image-editor";
import type { ImageEditorTool, ImageEditor as ImageEditorType } from "./toolbar/types";
import styled from "react-emotion";

export type ToolbarTool = "undo" | "redo" | "crop" | "flip" | "rotate" | "draw" | "filter";

type Props = {
    src: string,
    onChange: ?Function,
    tools: Array<ToolbarTool>
};

type State = {
    imageEditor: ?ImageEditorType,
    tool: ?Object
};

/**
 * TODO - should add following missing tools:
 * ClearObjects, RemoveActiveObject, Shape, Icon, Text, Filters (a few missing ones here like tilt)
 */

const Toolbar = styled("div")({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "var(--mdc-theme-secondary)",
    margin: "-20px -24px 0px -24px",
    padding: 2
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

class ImageEditor extends React.Component<Props, State> {
    static defaultProps = {
        tools: ["undo", "redo", "crop", "flip", "rotate", "draw", "filter"],
        onChange: null
    };

    state = {
        imageEditor: null,
        tool: null
    };

    imageEditorElement: any = React.createRef();

    componentDidMount() {
        const imageEditor = new TuiImageEditor(this.imageEditorElement, {
            cssMaxWidth: 700,
            cssMaxHeight: 400,
            selectionStyle: {
                cornerSize: 20,
                rotatingPointOffset: 70
            },
            usageStatistics: false
        });

        // Load image
        imageEditor.loadImageFromFile(this.props.src).then(() => this.resizeCanvas());

        imageEditor.on({
            undoStackChanged: () => {
                const { onChange } = this.props;
                onChange && onChange(imageEditor.toDataURL());
            },
            redoStackChanged: () => {
                const { onChange } = this.props;
                onChange && onChange(imageEditor.toDataURL());
            }
        });

        this.setState({ imageEditor });
    }

    componentWillUnmount() {
        this.state.imageEditor && this.state.imageEditor.destroy();
    }

    resizeCanvas() {
        const container = document.querySelector(".tui-image-editor-canvas-container");
        if (container) {
            const height = parseFloat(container.style.maxHeight);
            const width = parseFloat(container.style.maxWidth);

            this.imageEditorElement.style.width = width + "px";
            this.imageEditorElement.style.height = height + "px";
        }
    }

    render() {
        const { imageEditor } = this.state;
        const { tools } = this.props;

        return (
            <React.Fragment>
                {imageEditor && (
                    <Toolbar>
                        {tools.map(key => {
                            const tool: ?ImageEditorTool = toolbar[key];
                            if (!tool) {
                                return null;
                            }

                            return (
                                <React.Fragment key={key}>
                                    {tool.icon({
                                        imageEditor,
                                        enableTool: () => this.setState({ tool }),
                                        resizeCanvas: () => this.resizeCanvas()
                                    })}
                                </React.Fragment>
                            );
                        })}
                    </Toolbar>
                )}

                <ToolOptions>
                    {this.state.tool &&
                        typeof this.state.tool.subMenu === "function" &&
                        this.state.tool.subMenu({
                            imageEditor: this.state.imageEditor,
                            clearTool: () => this.setState({ tool: null }),
                            resizeCanvas: () => this.resizeCanvas()
                        })}
                    {!this.state.tool && (
                        <React.Fragment>
                            {"Select a tool to start working on your image."}
                        </React.Fragment>
                    )}
                </ToolOptions>

                <div ref={ref => (this.imageEditorElement = ref)} style={{ margin: "0 auto" }} />
            </React.Fragment>
        );
    }
}

export { ImageEditor };
