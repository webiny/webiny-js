//@flow
import React from "react";
import { ReactComponent as ShadowIcon } from "webiny-app-cms/editor/assets/icons/layers.svg";
import Settings from "./Settings";
import Action from "./../Action";

export default {
    name: "cms-element-settings-shadow",
    type: "cms-element-settings",
    renderAction({ active }: { active: boolean }) {
        return (
            <Action
                tooltip={"Shadow"}
                active={active}
                plugin={this.name}
                icon={<ShadowIcon />}
            />
        );
    },
    renderMenu() {
        return <Settings />;
    }
};
