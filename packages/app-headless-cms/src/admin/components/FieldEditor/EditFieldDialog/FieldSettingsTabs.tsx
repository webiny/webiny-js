import React from "react";
import { Tabs } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import type { CmsModelField } from "~/types.js";
import GeneralTab from "./GeneralTab.js";
import AppearanceTab from "./AppearanceTab.js";
import PredefinedValues from "./PredefinedValues.js";
import { ValidationTab } from "./ValidationTab/index.js";
import { PermissionsEditor } from "./PermissionsEditor/PermissionsEditor.js";
import { RulesEditor } from "./RulesEditor/RulesEditor.js";
import { ModelFieldProvider } from "~/admin/components/ModelFieldProvider/index.js";
import { useModelEditor } from "~/admin/components/ContentModelEditor/useModelEditor.js";

const t = i18n.namespace("app-headless-cms/admin/components/editor");

interface FieldSettingsTabsProps {
    shadowField: CmsModelField;
    predefinedValuesTabEnabled: boolean;
    showValidatorsTab: boolean;
    isSubtypeField: boolean;
}

export const FieldSettingsTabs = ({
    shadowField,
    predefinedValuesTabEnabled,
    showValidatorsTab,
    isSubtypeField
}: FieldSettingsTabsProps) => {
    const { fieldOptions } = useModelEditor();

    return (
        <ModelFieldProvider field={shadowField}>
            <Tabs
                spacing={"lg"}
                size={"md"}
                separator
                tabs={[
                    <Tabs.Tab
                        key={"general"}
                        trigger={t`General`}
                        value={"general"}
                        content={<GeneralTab />}
                    />,
                    <Tabs.Tab
                        key={"predefined"}
                        trigger={t`Predefined values`}
                        value={"predefined"}
                        disabled={!predefinedValuesTabEnabled}
                        content={<PredefinedValues />}
                    />,
                    <Tabs.Tab
                        key={"validations"}
                        trigger={t`Validations`}
                        value={"validations"}
                        content={<ValidationTab field={shadowField} />}
                        visible={showValidatorsTab}
                    />,
                    <Tabs.Tab
                        key={"appearance"}
                        trigger={t`Appearance`}
                        value={"Appearance"}
                        content={<AppearanceTab />}
                        disabled={isSubtypeField}
                    />,
                    <Tabs.Tab
                        key={"permissions"}
                        trigger={t`Permissions`}
                        value={"permissions"}
                        content={<PermissionsEditor />}
                    />,
                    <Tabs.Tab
                        key={"rules"}
                        trigger={t`Rules`}
                        value={"rules"}
                        content={<RulesEditor fieldOptions={fieldOptions} />}
                    />
                ]}
            />
        </ModelFieldProvider>
    );
};
