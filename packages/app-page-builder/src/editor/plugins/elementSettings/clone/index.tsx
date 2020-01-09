import React from "react";
import { ReactComponent as CloneIcon } from "@webiny/app-page-builder/editor/assets/icons/round-queue-24px.svg";
import Action from "../components/Action";
import CloneAction from "./CloneAction";
import { PbPageElementSettingsPlugin } from "@webiny/app-page-builder/admin/types";

export default {
    name: "pb-page-element-settings-clone",
    type: "pb-page-element-settings",
    renderAction() {
        return (
            <CloneAction>
                <Action tooltip={"Clone element"} icon={<CloneIcon />} />
            </CloneAction>
        );
    }
} as PbPageElementSettingsPlugin;
