import React from "react";
import { ReactComponent as AnimationIcon } from "./round-movie_filter-24px.svg";
import Action from "../components/Action";
import AnimationSettings from "./AnimationSettings";
import AnimationSettingsNew from "./AnimationSettingsNew";
import { PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/types";

export default {
    name: "pb-editor-page-element-settings-animation",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return <Action tooltip={"Animation"} plugin={this.name} icon={<AnimationIcon />} />;
    },
    renderMenu() {
        return <AnimationSettings title="Animation" styleAttribute="animation" />;
    },
    render() {
        return <AnimationSettingsNew />;
    }
} as PbEditorPageElementSettingsPlugin;
