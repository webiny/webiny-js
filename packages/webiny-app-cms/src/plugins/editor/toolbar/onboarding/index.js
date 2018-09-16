//@flow
import React from "react";
import { dispatch } from "webiny-app/redux";
import { togglePlugin } from "webiny-app-cms/editor/actions";
import { ReactComponent as HelpIcon } from "webiny-app-cms/editor/assets/icons/help_outline.svg";
import Onboarding from "./Onboarding";
import Action from "../Action";

export default {
    name: "toolbar-onboarding",
    type: "cms-toolbar-bottom",
    renderAction({ active }: { active: Boolean }) {
        return (
            <Action
                tooltip={"Get Started Guide"}
                active={active}
                onClick={() => dispatch(togglePlugin({ name: this.name }))}
                icon={<HelpIcon />}
            />
        );
    },
    renderDialog() {
        return <Onboarding />;
    }
};
