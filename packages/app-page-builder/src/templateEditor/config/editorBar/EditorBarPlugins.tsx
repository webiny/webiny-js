import React from "react";
import { BackButtonPlugin } from "./BackButton";
import { TemplateSettingsPlugin } from "./TemplateSettings";
import { SaveTemplateButtonPlugin } from "./SaveTemplateButton";
import { TitlePlugin } from "./Title";
import { EntrySelectorPlugin } from "./EntrySelector";

export const EditorBarPlugins = () => {
    return (
        <>
            <BackButtonPlugin />
            <TitlePlugin />
            <EntrySelectorPlugin />
            <TemplateSettingsPlugin />
            <SaveTemplateButtonPlugin />
        </>
    );
};
