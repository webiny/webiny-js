import React from "react";
import { TextFieldSettings } from "./text/TextFieldSettings";
import { TextareaFieldSettings } from "./textarea/TextareaFieldSettings";
import { CheckboxGroupFieldSettings } from "./checkboxGroup/CheckboxGroupFieldSettings";

export interface FieldSettingsDefinition {
    fieldType: string;
    settingsRenderer: React.ComponentType;
}

export const fieldSettings: FieldSettingsDefinition[] = [
    {
        fieldType: "text",
        settingsRenderer: TextFieldSettings
    },
    {
        fieldType: "textarea",
        settingsRenderer: TextareaFieldSettings
    },
    {
        fieldType: "checkboxGroup",
        settingsRenderer: CheckboxGroupFieldSettings
    }
];
