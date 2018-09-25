import React from "react";
import { connect } from "react-redux";
import { ActionCreators } from "redux-undo";
import HTML5Backend from "react-dnd-html5-backend";
import { DragDropContext } from "react-dnd";
import { compose, lifecycle } from "recompose";
import { getUi } from "webiny-app-cms/editor/selectors";
import { withKeyHandler } from "webiny-app-cms/editor/components";

// Components
import EditorBar from "./Bar";
import EditorToolbar from "./Toolbar";
import EditorContent from "./Content";
import DragPreview from "./DragPreview";
import Dialogs from "./Dialogs";

const Editor = () => {
    return (
        <React.Fragment>
            <EditorBar />
            <EditorToolbar />
            <EditorContent />
            <Dialogs />
            <DragPreview />
        </React.Fragment>
    );
};

export default compose(
    connect(
        state => ({
            slateFocused: getUi(state).slateFocused
        }),
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
