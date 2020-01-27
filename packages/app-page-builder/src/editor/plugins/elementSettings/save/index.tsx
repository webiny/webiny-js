import React from "react";
import { ReactComponent as FavoriteIcon } from "@webiny/app-page-builder/editor/assets/icons/round-favorite-24px.svg";
import Action from "../components/Action";
import SaveAction from "./SaveAction";
import { PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/types";

export default {
    name: "pb-editor-page-element-settings-save",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return (
            <SaveAction>
                <Action tooltip={"Save element"} icon={<FavoriteIcon />} />
            </SaveAction>
        );
    }
} as PbEditorPageElementSettingsPlugin;
