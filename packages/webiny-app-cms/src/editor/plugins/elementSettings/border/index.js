//@flow
import React from "react";
import { dispatch } from "webiny-app-cms/editor/redux";
import { togglePlugin } from "webiny-app-cms/editor/actions";
import { ReactComponent as BorderIcon } from "webiny-app-cms/editor/assets/icons/border_outer.svg";
import Settings from "./Settings";
import Action from "./../Action";

export default {
    name: "cms-element-settings-border",
    type: "cms-element-settings",
    renderAction({ active }: { active: boolean }) {
        return (
            <Action
                tooltip={"Border"}
                active={active}
                onClick={() => dispatch(togglePlugin({ name: this.name }))}
                icon={<BorderIcon />}
            />
        );
    },
    renderMenu() {
        return <Settings />;
    }
};
