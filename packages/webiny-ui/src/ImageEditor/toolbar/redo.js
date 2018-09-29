// @flow
import React from "react";
import { RedoIcon as RedoIconSvg } from "./icons";
import type { ImageEditorTool, ImageEditor } from "./types";
import styled from "react-emotion";
import classNames from "classnames";
import { IconButton } from "webiny-ui/Button";

const IconWrapper = styled("div")({
    "&.disabled": {
        opacity: 0.75,
        pointerEvents: "none"
    }
});

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
            <IconWrapper className={classNames({ disabled: !this.state.canRedo })}>
                <RedoIconSvg />
            </IconWrapper>
        );
    }
}

const tool: ImageEditorTool = {
    name: "redo",
    icon(props) {
        return <RedoIcon {...props} />;
    },
    onClick: imageEditor => {
        imageEditor.redo();
    }
};

export default tool;
