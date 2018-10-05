// @flow
import React from "react";
import { ReactComponent as UndoIconSvg } from "./icons/undo.svg";
import type { ImageEditorTool, ImageEditor } from "./types";
import { IconButton } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";

type Props = {
    imageEditor: ImageEditor
};
type State = {
    canUndo: boolean
};

class UndoIcon extends React.Component<Props, State> {
    state = {
        canUndo: false
    };

    componentDidMount() {
        this.props.imageEditor.on({
            undoStackChanged: length => {
                this.setState({ canUndo: length > 1 });
            }
        });
    }

    render() {
        return (
            <Tooltip placement={"bottom"} content={"Undo"}>
                <IconButton
                    disabled={!this.state.canUndo}
                    icon={<UndoIconSvg />}
                    onClick={() => {
                        this.state.canUndo && this.props.imageEditor.undo();
                        // Apparently, immediate call gets executed before the DOM has been updated.
                        setTimeout(() => this.props.resizeCanvas());
                    }}
                />
            </Tooltip>
        );
    }
}

const tool: ImageEditorTool = {
    name: "undo",
    icon(props) {
        return <UndoIcon {...props} />;
    }
};

export default tool;
