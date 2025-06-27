import React from "react";
import { ContainerAdminPlugins } from "./frontend/pageElements/container/admin/ContainerAdminPlugins";
import { StepAdminPlugins } from "./frontend/pageElements/step/admin/StepAdminPlugins";
import { TextFieldAdminPlugins } from "./frontend/pageElements/fields/text/TextFieldAdminPlugins";
import { TextareaFieldAdminPlugins } from "./frontend/pageElements/fields/textarea/TextareaFieldAdminPlugins";
import { CheckboxGroupFieldAdminPlugins } from "./frontend/pageElements/fields/checkboxGroup/CheckboxGroupFieldAdminPlugins";
import { FunnelBuilderPageElementGroup } from "./frontend/pageElements/FunnelBuilderPageElementGroup";
import { DecoratedElementControls } from "./frontend/pageElements/ElementControlsDecorator";
import { FieldValidatorPlugins } from "./frontend/admin/plugins/fieldValidators";
import { ConditionOperatorPlugins } from "./frontend/admin/plugins/conditionOperators";
import { ConditionActionPlugins } from "./frontend/admin/plugins/conditionActions";
import { PbEditorOverrideEventActionPlugins } from "./frontend/admin/plugins/editorActionOverrides";
import { PbEditorOverridePageElementSettingsPlugins } from "./frontend/admin/plugins/pageElementSettingsOverrides";
import { ControlsAdminPlugins } from "./frontend/pageElements/controls/ControlsAdminPlugins";
import { ButtonAdminPlugins } from "./frontend/pageElements/button/ButtonAdminPlugins";
import { ThemeSettingsProvider } from "./frontend/admin/ThemeSettingsProvider";
import { PbEditorLogUpdatePageErrorsPlugin } from "./frontend/admin/plugins/PbEditorLogUpdatePageErrors";

let extensionsRegistered = false;

export const Extension = () => {
    if (extensionsRegistered) {
        return null;
    }

    extensionsRegistered = true;

    return (
        <>
            {/* Fields. */}
            <TextFieldAdminPlugins />
            <TextareaFieldAdminPlugins />
            <CheckboxGroupFieldAdminPlugins />
            <ControlsAdminPlugins />
            <ButtonAdminPlugins />

            {/* Container Page Element */}
            <ContainerAdminPlugins />
            <StepAdminPlugins />

            {/* Other */}
            <FieldValidatorPlugins />
            <ConditionOperatorPlugins />
            <ConditionActionPlugins />
            <FunnelBuilderPageElementGroup />
            <DecoratedElementControls />
            <PbEditorOverrideEventActionPlugins />
            <PbEditorOverridePageElementSettingsPlugins />
            <ThemeSettingsProvider />
            <PbEditorLogUpdatePageErrorsPlugin />
        </>
    );
};
