import React from "react";
import { connect } from "react-redux";
import { ActionCreators } from "redux-undo";
import styled from "react-emotion";
import HTML5Backend from "react-dnd-html5-backend";
import { DragDropContext } from "react-dnd";
import { compose, lifecycle } from "recompose";
import { withActiveElement, withKeyHandler } from "webiny-app-cms/editor/components";
import { highlightElement, deactivateElement } from "webiny-app-cms/editor/actions";
import { getUi } from "webiny-app-cms/editor/selectors";

// Components
import EditorBar from "./Bar";
import EditorToolbar from "./Toolbar";
import EditorContent from "./Content";
import DragPreview from "./DragPreview";
import Dialogs from "./Dialogs";

const Background = styled("div")({
    position: "fixed",
    top: 0,
    left: 0,
    backgroundColor: "#EEEEEE",
    width: "100%",
    minHeight: "100%"
});

const Editor = ({ element, deactivateElement, highlightElement }) => {
    return (
        <React.Fragment>
            <Background
                onMouseOver={() => highlightElement({ element: null })}
                onClick={() => element && deactivateElement()}
            />
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
            deactivateElement,
            highlightElement,
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
    withActiveElement(),
    DragDropContext(HTML5Backend)
)(Editor);
