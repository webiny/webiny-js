//@flow
import React from "react";
import { dispatch } from "webiny-app/redux";
import { togglePlugin } from "webiny-app-cms/editor/actions";
import { getPlugin } from "webiny-app/plugins";
import { ReactComponent as SettingsIcon } from "webiny-app-cms/editor/assets/icons/settings.svg";
import AdvancedSettings from "./Advanced";
import Action from "./../Action";

export default {
    name: "element-settings-advanced",
    type: "cms-element-settings",
    renderAction({ active, element }: Object) {
        const plugin = getPlugin(element.type);
        if(plugin && typeof plugin.renderSidebar !== "function") {
            return null;
        }

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
