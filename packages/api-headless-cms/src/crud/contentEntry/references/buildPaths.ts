import type { CmsDynamicZoneTemplate, CmsEntryValues, CmsModelField } from "~/types/index.js";
import dotProp from "dot-prop";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";

type INarrowedCmsModelField = Pick<
    CmsModelField,
    "fieldId" | "multipleValues" | "type" | "settings"
>;

interface IResolveBaseRefField<TValues extends CmsEntryValues = CmsEntryValues> {
    collection: string[];
    field: INarrowedCmsModelField;
    parentPaths: string[];
    input: TValues | TValues[];
    isMultipleValues: boolean;
}

const resolveBaseRef = <TValues extends CmsEntryValues = CmsEntryValues>(
    params: IResolveBaseRefField<TValues>
): string[] => {
    const { field, parentPaths, input, collection, isMultipleValues } = params;
    const parentPathsValue = parentPaths.length > 0 ? `${parentPaths.join(".")}.` : "";
    if (field.multipleValues) {
        const inputValue = dotProp.get(input, `${field.fieldId}`, []);
        if (!Array.isArray(inputValue)) {
            return collection;
        }

        for (const key in inputValue) {
            const path = `${parentPathsValue}${field.fieldId}.${key}`;
            collection.push(path);
        }
        return collection;
    }

    if (isMultipleValues) {
        for (const key in input) {
            const path = `${parentPathsValue}${key}.${field.fieldId}`;
            collection.push(path);
        }
        return collection;
    }

    collection.push(`${parentPathsValue}${field.fieldId}`);

    return collection;
};

interface IBuildReferenceFieldPathsParams<TValues extends CmsEntryValues = CmsEntryValues> {
    fields: INarrowedCmsModelField[];
    parentPaths: string[];
    input: TValues | TValues[];
}

export const buildReferenceFieldPaths = <TValues extends CmsEntryValues = CmsEntryValues>(
    params: IBuildReferenceFieldPathsParams<TValues>
): string[] => {
    const { fields, parentPaths: initialParentPaths, input } = params;

    const parentPaths = [...initialParentPaths];

    const isMultipleValues = Array.isArray(input);

    return fields
        .filter(field => ["object", "ref", "dynamicZone"].includes(getBaseFieldType(field)))
        .reduce<string[]>((collection, field) => {
            /**
             * First we check the ref field
             */
            const baseType = getBaseFieldType(field);
            if (baseType === "ref") {
                return resolveBaseRef({
                    collection,
                    field,
                    parentPaths,
                    input,
                    isMultipleValues
                });
            }

            if (baseType === "dynamicZone") {
                const templates: CmsDynamicZoneTemplate[] = field.settings?.templates || [];

                if (field.multipleValues) {
                    const values = dotProp.get(input, field.fieldId, []);
                    if (!Array.isArray(values)) {
                        return collection;
                    }

                    values.forEach((value, index) => {
                        const template = templates.find(tpl => tpl.id === value["_templateId"]);
                        if (!template) {
                            return;
                        }

                        const result = buildReferenceFieldPaths({
                            fields: template.fields,
                            input: value,
                            parentPaths: parentPaths.concat([field.fieldId, String(index)])
                        });

                        collection.push(...result);
                    });

                    return collection;
                }

                const value = dotProp.get(input, field.fieldId, {});
                if (!value) {
                    return collection;
                }

                // @ts-expect-error We're sure that a template value contains a _templateId property.
                const template = templates.find(tpl => tpl.id === value["_templateId"]);

                if (!template) {
                    return collection;
                }

                const result = buildReferenceFieldPaths({
                    fields: template.fields,
                    input: value ?? {},
                    parentPaths: parentPaths.concat([field.fieldId])
                });
                collection.push(...result);

                return collection;
            }

            /**
             * Then we move onto the object field
             */
            const parentPathsValue = parentPaths.length > 0 ? `${parentPaths.join(".")}.` : "";
            /**
             * This is if received input is array. We need to map key with fieldId at this point.
             */
            if (isMultipleValues) {
                for (const key in input) {
                    const path = `${parentPathsValue}${key}.${field.fieldId}`;
                    collection.push(path);
                }
                return collection;
            }

            const objFieldPath = `${field.fieldId}`;
            const objFieldInputValue = dotProp.get(input, objFieldPath, []);

            /**
             * If field is multiple values one, we need to go through the input and use the existing keys.
             */
            if (field.multipleValues) {
                if (Array.isArray(objFieldInputValue) === false) {
                    return collection;
                }
                for (const key in objFieldInputValue) {
                    const result = buildReferenceFieldPaths({
                        fields: field.settings?.fields || [],
                        input: objFieldInputValue[key],
                        parentPaths: parentPaths.concat([field.fieldId, key])
                    });
                    collection.push(...result);
                }

                return collection;
            }

            /**
             * Single value reference field.
             */
            const results = buildReferenceFieldPaths({
                fields: field.settings?.fields || [],
                input: objFieldInputValue,
                parentPaths: parentPaths.concat([field.fieldId])
            });

            return collection.concat(results);
        }, []);
};
