//@flow
import React from "react";
import { dispatch } from "webiny-app/redux";
import { togglePlugin } from "webiny-app-cms/editor/actions";
import { ReactComponent as PaddingIcon } from "webiny-app-cms/editor/assets/icons/fullscreen_exit.svg";
import Settings from "../utils/PMSettings";
import Action from "./../Action";

export default {
    name: "element-settings-padding",
    type: "cms-element-settings",
    renderAction({ active }) {
        return (
            <Action
                tooltip={"Padding"}
                active={active}
                onClick={() => dispatch(togglePlugin({ name: this.name }))}
                icon={<PaddingIcon />}
            />
        );
    },
    renderMenu() {
        return <Settings title="Padding" styleAttribute="padding" />;
    }
};
