// @flow
import React from "react";
import { ReactComponent as RedoIconSvg } from "./icons/redo.svg";
import type { ImageEditorTool, ImageEditor } from "./types";
import { IconButton } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";

type Props = {
    imageEditor: ImageEditor
};
type State = {
    canRedo: boolean
};

class RedoIcon extends React.Component<Props, State> {
    state = {
        canRedo: false
    };

    componentDidMount() {
        this.props.imageEditor.on({
            redoStackChanged: length => {
                this.setState({ canRedo: length > 0 });
            }
        });
    }

    render() {
        return (
            <Tooltip placement={"bottom"} content={"Redo"}>
                <IconButton
                    disabled={!this.state.canRedo}
                    icon={<RedoIconSvg />}
                    onClick={() => {
                        this.state.canRedo && this.props.imageEditor.redo();
                    }}
                />
            </Tooltip>
        );
    }
}

const tool: ImageEditorTool = {
    name: "redo",
    icon({ imageEditor }) {
        return <RedoIcon imageEditor={imageEditor} />;
    }
};

export default tool;
