import type { PbEditorPageElementAdvancedSettingsPlugin as BasePbEditorPageElementAdvancedSettingsPlugin } from "~/types";
import { useRegisterLegacyPlugin } from "@webiny/app/hooks/useRegisterLegacyPlugin";

export interface PbEditorPageElementAdvancedSettingsPluginParams
    extends Pick<BasePbEditorPageElementAdvancedSettingsPlugin, "elementType" | "onSave"> {
    element: JSX.Element;
}

export const PbEditorPageElementAdvancedSettingsPlugin = (
    props: PbEditorPageElementAdvancedSettingsPluginParams
) => {
    useRegisterLegacyPlugin<BasePbEditorPageElementAdvancedSettingsPlugin>({
        ...props,
        render: () => props.element,
        type: "pb-editor-page-element-advanced-settings"
    });

    return null;
};
