//@flow
import React from "react";
import { dispatch } from "webiny-app/redux";
import { togglePlugin } from "webiny-app-cms/editor/actions";
import { ReactComponent as HelpIcon } from "webiny-app-cms/editor/assets/icons/help_outline.svg";
import HelpDialog from "./HelpDialog";
import Action from "../Action";

export default {
    name: "toolbar-help",
    type: "cms-toolbar-bottom",
    renderAction() {
        return (
            <Action
                tooltip={"Help"}
                onClick={() => dispatch(togglePlugin({ name: this.name }))}
                icon={<HelpIcon />}
            />
        );
    },
    renderDialog() {
        return <HelpDialog />;
    }
};
