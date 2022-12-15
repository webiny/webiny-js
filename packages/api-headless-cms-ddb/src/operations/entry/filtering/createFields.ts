import { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";
import { createSystemFields } from "./systemFields";
import { Field } from "./types";
import { PluginsContainer } from "@webiny/plugins";
import { CmsFieldFilterValueTransformPlugin } from "~/types";
import { CmsEntryFieldFilterPathPlugin } from "~/plugins";
import { getMappedPlugins } from "./mapPlugins";

interface Params {
    model: CmsModel;
    plugins: PluginsContainer;
}

interface Fields {
    [key: string]: Field;
}

/**
 * This method will map the fieldId (fieldId -> field) to the actual field.
 *
 * In case of nested fields, fieldId is all the parent fieldIds + current one, joined by the dot (.).
 * @param params
 */
export const createFields = (params: Params) => {
    const { model, plugins } = params;

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

    const collection = createSystemFields().reduce<Fields>((fields, field) => {
        const transformPlugin = transformValuePlugins[field.type];

        fields[field.fieldId] = {
            ...field,
            parents: [],
            system: true,
            createPath: () => {
                return field.settings?.path || field.fieldId;
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

        return fields;
    }, {});

    const addFieldsToCollection = (fields: CmsModelField[], parents: string[] = []): void => {
        /**
         * Exit early if no fields are sent.
         */
        if (fields.length === 0) {
            return;
        }
        for (const field of fields) {
            const transformPlugin = transformValuePlugins[field.type];
            const valuePathPlugin = valuePathPlugins[field.type];
            /**
             * The required fieldId is a product of all of its parents and its own fieldId.
             */
            const fieldId = parents.concat([field.fieldId]).join(".");

            collection[fieldId] = {
                ...field,
                parents,
                system: false,
                createPath: params => {
                    if (valuePathPlugin) {
                        return valuePathPlugin.createPath(params);
                    }
                    return `values.${params.field.storageId}`;
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
            if (!childFields || childFields.length === 0) {
                continue;
            }
            addFieldsToCollection(childFields, parents.concat([field.fieldId]));
        }
    };

    addFieldsToCollection(model.fields);

    return collection;
};
