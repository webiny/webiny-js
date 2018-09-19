//@flow
import React from "react";
import { connect } from "react-redux";
import { createAction } from "webiny-app/redux";
import { ReactComponent as RenderIcon } from "webiny-app-cms/editor/assets/icons/code.svg";
import Action from "../Action";

export default {
    name: "cms-toolbar-render-content",
    type: "cms-toolbar-bottom",
    renderAction() {
        return <RenderAction />;
    }
};

const myAction = createAction("render_content", {
    slice: "editor.ui.renderContent",
    reducer({ action }) {
        return action.payload.renderContent;
    }
});

const RenderAction = connect(
    state => ({
        renderContent: state.editor.ui.renderContent
    }),
    { myAction }
)(({ myAction, renderContent }) => {
    return (
        <Action
            active={renderContent}
            tooltip={`Render content`}
            onClick={() => myAction({ renderContent: !renderContent })}
            icon={<RenderIcon />}
        />
    );
});
