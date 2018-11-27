//@flow
import React from "react";
import { ReactComponent as WidthIcon } from "webiny-app-cms/editor/assets/icons/width-icon.svg";
import Settings from "./Settings";
import Action from "./../Action";

export default {
    name: "cms-element-settings-width",
    type: "cms-element-settings",
    renderAction({ active }: { active: boolean }) {
        return (
            <Action
                tooltip={"Width"}
                active={active}
                plugin={this.name}
                icon={<WidthIcon />}
            />
        );
    },
    renderMenu() {
        return <Settings />;
    }
};
