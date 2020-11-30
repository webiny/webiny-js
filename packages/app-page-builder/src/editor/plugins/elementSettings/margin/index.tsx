import React from "react";
import { ReactComponent as MarginIcon } from "@webiny/app-page-builder/editor/assets/icons/fullscreen.svg";
import Settings from "../components/PMSettings";
import MarginSettings from "../components/MarginPaddingSettings";
import Action from "../components/Action";
import { PbEditorPageElementSettingsPlugin } from "@webiny/app-page-builder/types";
import { AccordionItem } from "@webiny/ui/Accordion";

export default {
    name: "pb-editor-page-element-settings-margin",
    type: "pb-editor-page-element-settings",
    renderAction() {
        return <Action tooltip={"Margin"} plugin={this.name} icon={<MarginIcon />} />;
    },
    renderMenu() {
        return <Settings title="Margin" styleAttribute="margin" />;
    },
    render() {
        return (
            <AccordionItem
                icon={<MarginIcon />}
                title={"Margin"}
                description={"The space around an element."}
            >
                <MarginSettings styleAttribute={"margin"} />
            </AccordionItem>
        );
    }
} as PbEditorPageElementSettingsPlugin;
