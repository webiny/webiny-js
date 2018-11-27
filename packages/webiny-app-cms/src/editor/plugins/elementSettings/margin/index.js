//@flow
import React from "react";
import { ReactComponent as MarginIcon } from "webiny-app-cms/editor/assets/icons/fullscreen.svg";
import Settings from "../utils/PMSettings";
import Action from "./../Action";

export default {
    name: "cms-element-settings-margin",
    type: "cms-element-settings",
    renderAction({ active }: Object) {
        return (
            <Action
                tooltip={"Margin"}
                active={active}
                plugin={this.name}
                icon={<MarginIcon />}
            />
        );
    },
    renderMenu() {
        return <Settings title="Margin" styleAttribute="margin" />;
    }
};
