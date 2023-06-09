import React, { ReactElement } from "react";
import { Plugin } from "@webiny/app/types";
import { BindComponent } from "@webiny/form";
import { DynamicSourceSettings } from "~/components/Settings/DynamicSourceSettings";
import { BasicFieldLinkSettings } from "~/components/Settings/BasicFieldLinkSettings";
import { BlockVariantSettings } from "~/components/Settings/BlockVariantSettings";

type PbEditorPageElementDataSettingsPlugin = Plugin & {
    type: "pb-editor-page-element-data-settings";
    elementType: string;
    render(params: {
        Bind: BindComponent;
        data: any;
        submit: () => void;
        sourceModelId?: string;
    }): ReactElement;
};

type PbEditorPageElementParentDataSettingsPlugin = Plugin & {
    type: "pb-editor-page-element-parent-data-settings";
    elementType: string;
    render(params: {
        Bind: BindComponent;
        data: any;
        submit: () => void;
        sourceModelId: string;
        addVariant: () => void;
        removeVariant: (index: number) => void;
    }): ReactElement;
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

const pbBlockVariantSettings: PbEditorPageElementParentDataSettingsPlugin = {
    name: "pb-element-parent-data-settings-block-variant",
    type: "pb-editor-page-element-parent-data-settings",
    elementType: "block",
    render(props) {
        return <BlockVariantSettings {...props} />;
    }
};

export default () => [pbDynamicSourceSettings, pbBasicFieldLinkSettings, pbBlockVariantSettings];
