//@flow
import React from "react";
import { getPlugin } from "webiny-app/plugins";
import { ReactComponent as FavoriteIcon } from "webiny-app-cms/editor/assets/icons/round-favorite-24px.svg";
import Action from "../Action";
import SaveAction from "./SaveAction";

export default {
    name: "cms-element-settings-save",
    type: "cms-element-settings",
    renderAction({ parent, element }: Object) {
        const plugin = getPlugin(element.type);
        if (!plugin) {
            return null;
        }

        return (
            <SaveAction>
                <Action tooltip={"Save element"} icon={<FavoriteIcon />} />
            </SaveAction>
        );
    }
};
