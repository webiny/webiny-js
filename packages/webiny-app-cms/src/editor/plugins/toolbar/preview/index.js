//@flow
import React from "react";
import { ReactComponent as ActiveIcon } from "./round-visibility_off-24px.svg";
import { ReactComponent as InactiveIcon } from "./round-visibility-24px.svg";
import Action from "../Action";

export default {
    name: "cms-toolbar-preview",
    type: "cms-toolbar-top",
    renderAction({ active }: { active: Boolean }) {
        return (
            <Action
                plugin={this.name}
                icon={active ? <ActiveIcon /> : <InactiveIcon />}
                tooltip={"Preview"}
                active={active}
            />
        );
    }
};
