// @flow
import * as React from "react";
import * as toolbar from "./toolbar";
import TuiImageEditor from "tui-image-editor";
import type { ImageEditorTool } from "./toolbar/types";
import styled from "react-emotion";

export type ToolbarTool = "undo" | "redo" | "crop" | "flip" | "rotate" | "draw" | "filter";

type Props = {
    src: string,
    onChange: ?Function,
    tools: Array<ToolbarTool>
};

type State = {
    imageEditor: ?ImageEditor,
    tool: ?Object
};

/**
 * TODO - should add following missing tools:
 * ClearObjects, RemoveActiveObject, Shape, Icon, Text, Filters (a few missing ones here)
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
    imageEditor: ?TuiImageEditor = null;

    static defaultProps = {
        tools: ["undo", "redo", "crop", "flip", "rotate", "draw", "filter"],
        onChange: null
    };

    state = {
        imageEditor: null,
        tool: null,
        canUndo: false,
        canRedo: false
    };

    componentDidMount() {
        const imageEditor = new TuiImageEditor(document.querySelector("#tui-image-editor"), {
            cssMaxWidth: 700,
            cssMaxHeight: 600,
            selectionStyle: {
                cornerSize: 20,
                rotatingPointOffset: 70
            }
        });

        // Load image
        imageEditor.loadImageFromFile(this.props.src);
        imageEditor.on({
            undoStackChanged: () => {
                this.props.onChange && this.props.onChange(this.state.imageEditor.toDataURL());
            },
            redoStackChanged: () => {
                this.props.onChange && this.props.onChange(this.state.imageEditor.toDataURL());
            }
        });

        this.setState({ imageEditor });
    }

    render() {
        return (
            <React.Fragment>
                {this.state.imageEditor && (
                    <Toolbar>
                        {this.props.tools.map(key => {
                            const tool: ?ImageEditorTool = toolbar[key];
                            if (!tool) {
                                return null;
                            }

                            return (
                                <li key={key}>
                                    {tool.icon({
                                        imageEditor: this.state.imageEditor,
                                        enableTool: () => {
                                            this.setState({ tool });
                                        }
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
                                clearTool: () => this.setState({ tool: null })
                            })}
                        </ToolOptions>
                    )}

                <div id="tui-image-editor" style={{ height: 600 }}>
                    <canvas />
                </div>
            </React.Fragment>
        );
    }
}

export { ImageEditor };
