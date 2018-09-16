//@flow
import React from "react";
import { dispatch } from "webiny-app/redux";
import { togglePlugin } from "webiny-app-cms/editor/actions";
import { ReactComponent as WidthIcon } from "webiny-app-cms/editor/assets/icons/width-icon.svg";
import Settings from "./Settings";
import Action from "./../Action";

export default {
    name: "element-settings-width",
    type: "cms-element-settings",
    renderAction({ active }: { active: boolean }) {
        return (
            <Action
                tooltip={"Width"}
                active={active}
                onClick={() => dispatch(togglePlugin({ name: this.name }))}
                icon={<WidthIcon />}
            />
        );
    },
    renderMenu() {
        return <Settings />;
    }
};
