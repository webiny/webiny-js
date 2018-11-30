//@flow
import React from "react";
import { getPlugin } from "webiny-plugins";
import { ReactComponent as FavoriteIcon } from "webiny-app-cms/editor/assets/icons/round-favorite-24px.svg";
import Action from "../components/Action";
import SaveAction from "./SaveAction";

export default {
    name: "cms-element-settings-save",
    type: "cms-element-settings",
    renderAction() {
        return (
            <SaveAction>
                <Action tooltip={"Save element"} icon={<FavoriteIcon />} />
            </SaveAction>
        );
    }
};
