import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { createSystemFields } from "./systemFields.js";
import type { Field, FieldParent } from "./types.js";
import type { FieldFilterPathRegistry } from "../../abstractions/FieldFilterPathRegistry.js";
import type { FieldFilterValueTransformRegistry } from "../../abstractions/FieldFilterValueTransformRegistry.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";

interface Params {
    fields: CmsModelField[];
    pathRegistry: FieldFilterPathRegistry.Interface;
    transformRegistry: FieldFilterValueTransformRegistry.Interface;
}

interface FieldCollection {
    [key: string]: Field;
}

interface AddFieldsToCollectionParams {
    fields: CmsModelField[];
    parents: FieldParent[];
    pathRegistry: FieldFilterPathRegistry.Interface;
    transformRegistry: FieldFilterValueTransformRegistry.Interface;
    system: boolean;
}

const createFieldCollection = (params: AddFieldsToCollectionParams): FieldCollection => {
    const { fields, parents, pathRegistry, transformRegistry, system } = params;
    return fields.reduce<FieldCollection>((collection, field) => {
        const fieldType = getBaseFieldType(field);
        const transformHandler = transformRegistry.get(fieldType);
        const pathHandler = pathRegistry.get(fieldType);

        const fieldId = [
            ...parents,
            {
                fieldId: field.fieldId,
                list: field.list
            }
        ]
            .map(f => f.fieldId)
            .join(".");

        collection[fieldId] = {
            ...field,
            parents,
            system,
            createPath: pathParams => {
                if (
                    pathHandler &&
                    pathHandler.canUse(
                        field,
                        parents.map(p => p.fieldId)
                    )
                ) {
                    return pathHandler.createPath(pathParams);
                }

                return parents
                    .map(parent => parent.fieldId)
                    .concat([pathParams.field.fieldId])
                    .join(".");
            },
            transform: value => {
                if (!transformHandler) {
                    return value;
                }
                return transformHandler.transform({
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
                    list: field.list
                }
            ],
            pathRegistry,
            transformRegistry,
            system
        });
        Object.assign(collection, result);
        return collection;
    }, {});
};

export const createFields = (params: Params) => {
    const { fields, pathRegistry, transformRegistry } = params;

    const collection = createFieldCollection({
        fields: createSystemFields(),
        pathRegistry,
        transformRegistry,
        parents: [],
        system: true
    });

    const result = createFieldCollection({
        fields,
        pathRegistry,
        transformRegistry,
        parents: [
            {
                fieldId: "values",
                list: false
            }
        ],
        system: false
    });

    return {
        ...collection,
        ...result
    };
};
