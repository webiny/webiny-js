import React from "react";
import type {
    CmsAlertLayoutField,
    CmsLayoutField,
    CmsSeparatorLayoutField,
    CmsTabLayoutField
} from "~/types/model.js";
import type {
    BindComponent,
    CmsEditorContentModel,
    CmsModelLayoutFieldRendererPlugin,
    CmsModelField
} from "~/types/index.js";
import { plugins } from "@webiny/plugins";
import { SeparatorFieldRenderer } from "./layoutFieldRenderers/SeparatorFieldRenderer.js";
import { AlertFieldRenderer } from "./layoutFieldRenderers/AlertFieldRenderer.js";
import { TabsFieldRenderer } from "./layoutFieldRenderers/TabsFieldRenderer.js";

interface LayoutDescriptorCellProps {
    field: CmsLayoutField;
    Bind: BindComponent;
    fields: CmsModelField[];
    contentModel: CmsEditorContentModel;
    gridClassName?: string;
}

export const LayoutDescriptorCell = ({
    field,
    Bind,
    fields,
    contentModel,
    gridClassName
}: LayoutDescriptorCellProps) => {
    switch (field.type) {
        case "separator":
            return <SeparatorFieldRenderer field={field as CmsSeparatorLayoutField} />;
        case "alert":
            return <AlertFieldRenderer field={field as CmsAlertLayoutField} />;
        case "tabs":
            return (
                <TabsFieldRenderer
                    field={field as CmsTabLayoutField}
                    Bind={Bind}
                    fields={fields}
                    contentModel={contentModel}
                    gridClassName={gridClassName}
                />
            );
        default: {
            const rendererPlugin = plugins
                .byType<CmsModelLayoutFieldRendererPlugin>("cms-layout-field-renderer")
                .find(p => p.fieldType === field.type);
            if (rendererPlugin) {
                return rendererPlugin.render({
                    field,
                    Bind,
                    fields,
                    contentModel,
                    gridClassName
                });
            }
            return null;
        }
    }
};
