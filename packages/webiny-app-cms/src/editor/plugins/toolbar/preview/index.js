//@flow
import * as React from "react";
import { ReactComponent as ActiveIcon } from "./round-visibility_off-24px.svg";
import { ReactComponent as InactiveIcon } from "./round-visibility-24px.svg";
import Action from "../Action";

// eslint-disable-next-line
const icons = [<ActiveIcon />, <InactiveIcon />];

export default {
    name: "cms-toolbar-preview",
    type: "cms-toolbar-top",
    renderAction() {
        return <Action plugin={this.name} icon={icons} tooltip={"Preview"} />;
    }
};
