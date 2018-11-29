// @flow
import React from "react";
import { connect } from "react-redux";
import classSet from "classnames";
import { ActionCreators } from "redux-undo";
import HTML5Backend from "react-dnd-html5-backend";
import { DragDropContext } from "react-dnd";
import { compose, lifecycle } from "recompose";
import { getUi } from "webiny-app-cms/editor/selectors";
import { withKeyHandler } from "webiny-app-cms/editor/components";
import "./Editor.scss";

// Components
import EditorBar from "./Bar";
import EditorToolbar from "./Toolbar";
import EditorContent from "./Content";
import DragPreview from "./DragPreview";
import Dialogs from "./Dialogs";

type Props = {
    isDragging: boolean,
    isResizing: boolean
};

const Editor = ({ isDragging, isResizing }: Props) => {
    const classes = {
        "cms-editor": true,
        "cms-editor-dragging": isDragging,
        "cms-editor-resizing": isResizing
    };
    return (
        <div className={classSet(classes)}>
            <EditorBar />
            <EditorToolbar />
            <EditorContent />
            <Dialogs />
            <DragPreview />
        </div>
    );
};

export default compose(
    connect(
        state => {
            const ui: Object = getUi(state);

            return {
                slateFocused: ui.slateFocused,
                isDragging: ui.dragging,
                isResizing: ui.resizing
            };
        },
        {
            undo: ActionCreators.undo,
            redo: ActionCreators.redo
        }
    ),
    withKeyHandler(),
    lifecycle({
        componentDidMount() {
            const { addKeyHandler, undo, redo } = this.props;
            addKeyHandler("mod+z", e => {
                if (!this.props.slateFocused) {
                    e.preventDefault();
                    undo();
                }
            });
            addKeyHandler("mod+shift+z", e => {
                if (!this.props.slateFocused) {
                    e.preventDefault();
                    redo();
                }
            });
        },
        componentWillUnmount() {
            this.props.removeKeyHandler("mod+z");
            this.props.removeKeyHandler("mod+shift+z");
        }
    }),
    DragDropContext(HTML5Backend)
)(Editor);
