//@flow
import React from "react";
import { ReactComponent as HelpIcon } from "webiny-app-cms/editor/assets/icons/help_outline.svg";
import Onboarding from "./Onboarding";
import Action from "../Action";

export default {
    name: "toolbar-onboarding",
    type: "cms-toolbar-bottom",
    renderAction() {
        return <Action plugin={this.name} tooltip={"Get Started Guide"} icon={<HelpIcon />} />;
    },
    renderDialog() {
        return <Onboarding />;
    }
};
