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
    listStyle: "none",
    li: {
        display: "inline-block",
        padding: 5
    }
});

const ToolOptions = styled("div")({
    listStyle: "none",
    li: {
        display: "inline-block",
        padding: 5
    }
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
            }
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
                                <li key={key}>
                                    {tool.icon({
                                        imageEditor,
                                        enableTool: () => this.setState({ tool }),
                                        resizeCanvas: () => this.resizeCanvas()
                                    })}
                                </li>
                            );
                        })}
                    </Toolbar>
                )}

                {this.state.tool &&
                    typeof this.state.tool.subMenu === "function" && (
                        <ToolOptions>
                            {this.state.tool.subMenu({
                                imageEditor: this.state.imageEditor,
                                clearTool: () => this.setState({ tool: null }),
                                resizeCanvas: () => this.resizeCanvas()
                            })}
                        </ToolOptions>
                    )}

                <div ref={ref => (this.imageEditorElement = ref)} style={{ margin: "0 auto" }} />
            </React.Fragment>
        );
    }
}

export { ImageEditor };
