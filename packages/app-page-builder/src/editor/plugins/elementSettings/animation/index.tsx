import React from "react";
import { ReactComponent as AnimationIcon } from "./round-movie_filter-24px.svg";
import Action from "../components/Action";
import AnimationSettings from "./AnimationSettings";
import { PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/admin/types";

export default {
    name: "pb-editor-page-element-settings-animation",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return <Action tooltip={"Animation"} plugin={this.name} icon={<AnimationIcon />} />;
    },
    renderMenu() {
        return <AnimationSettings title="Animation" styleAttribute="animation" />;
    }
} as PbEditorPageElementSettingsPlugin;
