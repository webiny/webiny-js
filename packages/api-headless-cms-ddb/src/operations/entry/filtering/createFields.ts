import { CmsModelField } from "@webiny/api-headless-cms/types";
import { createSystemFields } from "./systemFields";
import { Field, FieldParent } from "./types";
import { PluginsContainer } from "@webiny/plugins";
import { CmsFieldFilterValueTransformPlugin } from "~/types";
import { CmsEntryFieldFilterPathPlugin } from "~/plugins";
import { getMappedPlugins } from "./mapPlugins";

interface Params {
    fields: CmsModelField[];
    plugins: PluginsContainer;
}

interface FieldCollection {
    [key: string]: Field;
}

interface AddFieldsToCollectionParams {
    fields: CmsModelField[];
    parents: FieldParent[];
    transformValuePlugins: Record<string, CmsFieldFilterValueTransformPlugin>;
    valuePathPlugins: Record<string, CmsEntryFieldFilterPathPlugin>;
    system: boolean;
}

const createFieldCollection = (params: AddFieldsToCollectionParams): FieldCollection => {
    const { fields, parents, transformValuePlugins, valuePathPlugins, system } = params;
    return fields.reduce<FieldCollection>((collection, field) => {
        const transformPlugin = transformValuePlugins[field.type];
        const valuePathPlugin = valuePathPlugins[field.type];

        const basePath = system ? [] : ["values"];
        /**
         * The required fieldId is a product of all of its parents and its own fieldId.
         */
        const fieldId = [
            ...parents,
            {
                fieldId: field.fieldId,
                multipleValues: field.multipleValues
            }
        ]
            .map(f => f.fieldId)
            .join(".");

        collection[fieldId] = {
            ...field,
            parents,
            system,
            createPath: params => {
                if (
                    valuePathPlugin &&
                    valuePathPlugin.canUse(
                        field,
                        parents.map(p => p.fieldId)
                    )
                ) {
                    return valuePathPlugin.createPath(params);
                }

                return basePath
                    .concat(parents.map(parent => parent.fieldId))
                    .concat([params.field.fieldId])
                    .join(".");
            },
            transform: value => {
                if (!transformPlugin) {
                    return value;
                }
                return transformPlugin.transform({
                    field,
                    value
                });
            }
        };
        const childFields = field.settings?.fields;
        if (!childFields?.length) {
            return collection;
        }

        const result = createFieldCollection({
            fields: childFields,
            parents: [
                ...parents,
                {
                    fieldId: field.fieldId,
                    multipleValues: field.multipleValues
                }
            ],
            transformValuePlugins,
            valuePathPlugins,
            system
        });
        Object.assign(collection, result);
        return collection;
    }, {});
};
/**
 * This method will map the fieldId (fieldId -> field) to the actual field.
 *
 * In case of nested fields, fieldId is all the parent fieldIds + current one, joined by the dot (.).
 */
export const createFields = (params: Params) => {
    const { fields, plugins } = params;

    const transformValuePlugins = getMappedPlugins<CmsFieldFilterValueTransformPlugin>({
        plugins,
        type: "cms-field-filter-value-transform",
        property: "fieldType"
    });
    const valuePathPlugins = getMappedPlugins<CmsEntryFieldFilterPathPlugin>({
        plugins,
        type: CmsEntryFieldFilterPathPlugin.type,
        property: "fieldType"
    });

    const collection = createFieldCollection({
        fields: createSystemFields(),
        transformValuePlugins,
        valuePathPlugins,
        parents: [],
        system: true
    });

    const result = createFieldCollection({
        fields,
        transformValuePlugins,
        valuePathPlugins,
        parents: [],
        system: false
    });

    return {
        ...collection,
        ...result
    };
};
