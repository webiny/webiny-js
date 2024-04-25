import { useContext } from "react";
import { plugins } from "@webiny/plugins";
import { makeDecoratable } from "@webiny/react-composition";
import { ModelFieldContext, useParentValueIndex } from "./ModelFieldContext";
import { CmsModelField, CmsModelFieldTypePlugin } from "~/types";

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

export interface UseModelField {
    field: CmsModelField;
    parentValueIndex: number;
    fieldPlugin: CmsModelFieldTypePlugin;
}

/**
 * Get model field from the current context.
 */
export const useModelField = makeDecoratable((): UseModelField => {
    const field = useContext(ModelFieldContext);
    const parentValueIndex = useParentValueIndex();

    if (!field) {
        throw Error(
            `Missing "ModelFieldProvider" in the component tree. Are you using the "useModelField()" hook in the right place?`
        );
    }

    const fieldPlugin = getFieldPlugin(field.type);

    return { field, fieldPlugin, parentValueIndex };
});
