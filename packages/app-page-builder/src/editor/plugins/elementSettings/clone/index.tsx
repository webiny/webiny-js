import React from "react";
import { ReactComponent as CloneIcon } from "../../../assets/icons/round-queue-24px.svg";
import Action from "../components/Action";
import CloneAction from "./CloneAction";
import { PbEditorPageElementSettingsPlugin } from "../../../../types";

export default {
    name: "pb-editor-page-element-settings-clone",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return (
            <CloneAction>
                <Action tooltip={"Clone selected"} icon={<CloneIcon />} />
            </CloneAction>
        );
    }
} as PbEditorPageElementSettingsPlugin;
