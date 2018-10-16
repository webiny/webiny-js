//@flow
import React from "react";
import { dispatch } from "webiny-app-cms/editor/redux";
import { togglePlugin } from "webiny-app-cms/editor/actions";
import { ReactComponent as SettingsIcon } from "webiny-app-cms/editor/assets/icons/settings.svg";
import AdvancedSettings from "./Advanced";
import Action from "./../Action";

export default {
    name: "cms-element-settings-advanced",
    type: "cms-element-settings",
    renderAction({ active }: Object) {
        return (
            <Action
                tooltip={"Advance settings"}
                active={active}
                onClick={() => dispatch(togglePlugin({ name: this.name }))}
                icon={<SettingsIcon />}
            />
        );
    },
    renderSidebar() {
        return <AdvancedSettings />;
    }
};
