import React from "react";
import type {
    CmsAlertLayoutDescriptor,
    CmsLayoutDescriptor,
    CmsSeparatorLayoutDescriptor,
    CmsTabLayoutDescriptor,
    CmsEditorFieldsLayout
} from "~/types/model.js";
import type { BindComponent, CmsEditorContentModel, CmsModelField } from "~/types/index.js";
import { SeparatorFieldRenderer } from "./layoutFieldRenderers/SeparatorFieldRenderer.js";
import { AlertFieldRenderer } from "./layoutFieldRenderers/AlertFieldRenderer.js";
import { TabsFieldRenderer } from "./layoutFieldRenderers/TabsFieldRenderer.js";

interface LayoutDescriptorCellProps {
    descriptor: CmsLayoutDescriptor;
    Bind: BindComponent;
    fields: CmsModelField[];
    contentModel: CmsEditorContentModel;
    gridClassName?: string;
    FieldsComponent: React.ComponentType<{
        Bind: BindComponent;
        fields: CmsModelField[];
        layout: CmsEditorFieldsLayout;
        contentModel: CmsEditorContentModel;
        gridClassName?: string;
    }>;
}

export const LayoutDescriptorCell = ({
    descriptor,
    Bind,
    fields,
    contentModel,
    gridClassName,
    FieldsComponent
}: LayoutDescriptorCellProps) => {
    switch (descriptor.type) {
        case "separator":
            return (
                <SeparatorFieldRenderer descriptor={descriptor as CmsSeparatorLayoutDescriptor} />
            );
        case "alert":
            return <AlertFieldRenderer descriptor={descriptor as CmsAlertLayoutDescriptor} />;
        case "tabs":
            return (
                <TabsFieldRenderer
                    descriptor={descriptor as CmsTabLayoutDescriptor}
                    Bind={Bind}
                    fields={fields}
                    contentModel={contentModel}
                    gridClassName={gridClassName}
                    FieldsComponent={FieldsComponent}
                />
            );
        default:
            return null;
    }
};
