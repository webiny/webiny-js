import React from "react";
import { PbEditorPageElementSettingsPlugin } from "~/types";
import { ReactComponent as FavoriteIcon } from "../../../assets/icons/round-favorite-24px.svg";
import Action from "../components/Action";
import SaveAction from "./SaveAction";

export default {
    name: "pb-editor-page-element-settings-save",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return (
            <SaveAction>
                <Action tooltip={"Save selected"} icon={<FavoriteIcon />} />
            </SaveAction>
        );
    }
} as PbEditorPageElementSettingsPlugin;
