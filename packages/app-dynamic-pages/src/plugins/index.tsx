import React, { ReactElement } from "react";
import { Plugin } from "@webiny/app/types";
import { BindComponent } from "@webiny/form";
import { GenericFormData } from "@webiny/form/types";
import { DynamicSourceSettings } from "~/components/Settings/DynamicSourceSettings";
import { BasicFieldLinkSettings } from "~/components/Settings/BasicFieldLinkSettings";

type PbEditorPageElementDataSettingsPlugin = Plugin & {
    type: "pb-editor-page-element-data-settings";
    elementType: string;
    render(params: {
        Bind: BindComponent;
        data: any;
        submit: () => void;
        sourceModelId?: string;
    }): ReactElement;
    onSave?: (data: GenericFormData) => Promise<GenericFormData>;
};

const pbDynamicSourceSettings: PbEditorPageElementDataSettingsPlugin = {
    name: "pb-element-data-settings-dynamic-source",
    type: "pb-editor-page-element-data-settings",
    elementType: "block",
    render(props) {
        return <DynamicSourceSettings {...props} />;
    }
};

const pbBasicFieldLinkSettings: PbEditorPageElementDataSettingsPlugin = {
    name: "pb-element-data-settings-basic-field-link",
    type: "pb-editor-page-element-data-settings",
    elementType: "element",
    render(props) {
        return <BasicFieldLinkSettings {...props} />;
    }
};

export default () => [pbDynamicSourceSettings, pbBasicFieldLinkSettings];
