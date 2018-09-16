//@flow
import React from "react";
import { dispatch } from "webiny-app/redux";
import { togglePlugin } from "webiny-app-cms/editor/actions";
import { ReactComponent as MarginIcon } from "webiny-app-cms/editor/assets/icons/fullscreen.svg";
import Settings from "../utils/PMSettings";
import Action from "./../Action";

export default {
    name: "element-settings-margin",
    type: "cms-element-settings",
    renderAction({ active }) {
        return (
            <Action
                tooltip={"Margin"}
                active={active}
                onClick={() => dispatch(togglePlugin({ name: this.name }))}
                icon={<MarginIcon />}
            />
        );
    },
    renderMenu() {
        return <Settings title="Margin" styleAttribute="margin" />;
    }
};
