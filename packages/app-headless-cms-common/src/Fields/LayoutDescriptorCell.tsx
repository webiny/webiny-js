import React from "react";
import type {
    CmsAlertLayoutDescriptor,
    CmsLayoutDescriptor,
    CmsSeparatorLayoutDescriptor,
    CmsTabLayoutDescriptor
} from "~/types/model.js";
import type {
    BindComponent,
    CmsEditorContentModel,
    CmsLayoutDescriptorRendererPlugin,
    CmsModelField
} from "~/types/index.js";
import { plugins } from "@webiny/plugins";
import { SeparatorFieldRenderer } from "./layoutFieldRenderers/SeparatorFieldRenderer.js";
import { AlertFieldRenderer } from "./layoutFieldRenderers/AlertFieldRenderer.js";
import { TabsFieldRenderer } from "./layoutFieldRenderers/TabsFieldRenderer.js";

interface LayoutDescriptorCellProps {
    descriptor: CmsLayoutDescriptor;
    Bind: BindComponent;
    fields: CmsModelField[];
    contentModel: CmsEditorContentModel;
    gridClassName?: string;
}

export const LayoutDescriptorCell = ({
    descriptor,
    Bind,
    fields,
    contentModel,
    gridClassName
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
                />
            );
        default: {
            const rendererPlugin = plugins
                .byType<CmsLayoutDescriptorRendererPlugin>("cms-layout-descriptor-renderer")
                .find(p => p.descriptorType === descriptor.type);
            if (rendererPlugin) {
                return rendererPlugin.render({
                    descriptor,
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
