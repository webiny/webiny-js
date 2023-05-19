import React from "react";
import { TemplateSettingsOverlay } from "./TemplateSettings";
import { AddTemplateSettingsButton } from "./TemplateSettingsButton";

export const TemplateSettingsPlugin = () => {
    return (
        <>
            <TemplateSettingsOverlay />
            <AddTemplateSettingsButton />
        </>
    );
};
