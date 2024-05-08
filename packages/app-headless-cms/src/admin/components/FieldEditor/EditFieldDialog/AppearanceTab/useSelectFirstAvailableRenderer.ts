import { useEffect } from "react";
import { useRendererPlugins } from "~/admin/components/FieldEditor/EditFieldDialog/AppearanceTab/useRendererPlugins";
import { useModelField } from "~/admin/components/ModelFieldProvider";
import { UseBindHook } from "@webiny/form";

export const useSelectFirstAvailableRenderer = (bind: UseBindHook) => {
    const renderers = useRendererPlugins();
    const { field } = useModelField();

    useEffect(() => {
        // If the currently selected render plugin is no longer available, select the first available one.
        const currentlySelectedRenderAvailable = renderers.find(
            item => item.renderer.rendererName === field.renderer.name
        );

        if (currentlySelectedRenderAvailable) {
            return;
        }

        if (renderers[0]) {
            bind.onChange(renderers[0].renderer.rendererName);
            return;
        }

        console.info(`No renderers for field ${field.fieldId} found.`, field);
    }, [field.id, field.multipleValues, field.predefinedValues?.enabled]);
};
