import { useContext } from "react";
import { ModelFieldContext } from "./ModelFieldContext";
import { plugins } from "@webiny/plugins";
import { CmsModelFieldTypePlugin } from "~/types";

interface GetFieldPlugin {
    (type: string): CmsModelFieldTypePlugin;
}

const getFieldPlugin: GetFieldPlugin = type => {
    const plugin = plugins
        .byType<CmsModelFieldTypePlugin>("cms-editor-field-type")
        .find(plugin => plugin.field.type === type);

    if (!plugin) {
        throw Error(`Missing plugin for field type "${type}"!`);
    }

    return plugin;
};

/**
 * Get model field from the current context.
 */
export function useModelField() {
    const field = useContext(ModelFieldContext);
    if (!field) {
        throw Error(
            `Missing "ModelFieldProvider" in the component tree. Are you using the "useModelField()" hook in the right place?`
        );
    }

    const fieldPlugin = getFieldPlugin(field.type);

    return { field, fieldPlugin };
}
