import React from "react";
import { BackButtonPlugin } from "./BackButton";
import { TemplateSettingsPlugin } from "./TemplateSettings";
import { SaveTemplateButtonPlugin } from "./SaveTemplateButton";
import { TitlePlugin } from "./Title";

export const EditorBarPlugins = () => {
    return (
        <>
            <BackButtonPlugin />
            <TitlePlugin />
            <TemplateSettingsPlugin />
            <SaveTemplateButtonPlugin />
        </>
    );
};
