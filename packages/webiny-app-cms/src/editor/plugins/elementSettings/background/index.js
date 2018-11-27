//@flow
import React from "react";
import { ReactComponent as InvertColorsIcon } from "webiny-app-cms/editor/assets/icons/invert_colors.svg";
import Settings from "./Settings";
import Action from "./../Action";

export default {
    name: "cms-element-settings-background",
    type: "cms-element-settings",
    renderAction({ active }: { active: boolean }) {
        return (
            <Action
                plugin={this.name}
                tooltip={"Background"}
                icon={<InvertColorsIcon />}
                active={active}
            />
        );
    },
    renderMenu() {
        return <Settings />;
    }
};
