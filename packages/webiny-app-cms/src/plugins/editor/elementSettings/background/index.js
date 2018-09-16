//@flow
import React from "react";
import { dispatch } from "webiny-app/redux";
import { togglePlugin } from "webiny-app-cms/editor/actions";
import { ReactComponent as InvertColorsIcon } from "webiny-app-cms/editor/assets/icons/invert_colors.svg";
import Settings from "./Settings";
import Action from "./../Action";

export default {
    name: "element-settings-background",
    type: "cms-element-settings",
    renderAction({ active }: { active: boolean }) {
        return (
            <Action
                tooltip={"Background"}
                onClick={() => dispatch(togglePlugin({ name: this.name }))}
                icon={<InvertColorsIcon />}
                active={active}
            />
        );
    },
    renderMenu() {
        return <Settings />;
    }
};
