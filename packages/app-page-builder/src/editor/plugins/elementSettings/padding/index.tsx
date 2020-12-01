import React from "react";
import { PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/types";
// Components
import Settings from "../components/PMSettings";
import Action from "../components/Action";
import Accordion from "../components/Accordion";
import MarginPaddingSettings from "../components/MarginPaddingSettings";
// Icons
import { ReactComponent as PaddingIcon } from "@webiny/app-page-builder/editor/assets/icons/fullscreen_exit.svg";

export default {
    name: "pb-editor-page-element-settings-padding",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return <Action tooltip={"Padding"} plugin={this.name} icon={<PaddingIcon />} />;
    },
    renderMenu() {
        return <Settings title="Padding" styleAttribute="padding" />;
    },
    render() {
        return (
            <Accordion title={"Padding"}>
                <MarginPaddingSettings styleAttribute={"padding"} />
            </Accordion>
        );
    }
} as PbEditorPageElementSettingsPlugin;
