import {
    CmsContentModel,
    CmsContentModelField,
    CmsContext,
    CmsModelFieldToGraphQLPlugin
} from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";
import { CmsModelFieldToElasticsearchPlugin } from "~/types";

type ModelFieldPath = string | ((value: string) => string);
export interface ModelField {
    unmappedType?: string;
    keyword?: boolean;
    isSearchable: boolean;
    isSortable: boolean;
    type: string;
    isSystemField?: boolean;
    field: CmsContentModelField;
    path?: ModelFieldPath;
}

export type ModelFields = Record<string, ModelField>;

type UnmappedFieldTypes = {
    [type: string]: (field: CmsContentModelField) => string | undefined;
};

interface FieldTypePlugin {
    unmappedType?: (field: CmsContentModelField) => string | undefined;
    isSearchable: boolean;
    isSortable: boolean;
}
type FieldTypePlugins = Record<string, FieldTypePlugin>;

const createSystemField = (field: Partial<CmsContentModelField>): CmsContentModelField => {
    if (!field.fieldId) {
        throw new WebinyError(
            `When creating system field it must have a "entryId".`,
            "SYSTEM_FIELD_ERROR",
            {
                field
            }
        );
    } else if (!field.type) {
        throw new WebinyError(
            `When creating system field it must have a "type".`,
            "SYSTEM_FIELD_ERROR",
            {
                field
            }
        );
    }
    return field as unknown as CmsContentModelField;
};

export const systemFields = {
    id: {
        type: "text",
        isSystemField: true,
        isSearchable: true,
        isSortable: true,
        field: createSystemField({
            fieldId: "id",
            type: "text"
        })
    },
    entryId: {
        type: "text",
        isSystemField: true,
        isSearchable: true,
        isSortable: true,
        field: createSystemField({
            fieldId: "entryId",
            type: "text"
        })
    },
    savedOn: {
        type: "date",
        unmappedType: "date",
        keyword: false,
        isSystemField: true,
        isSearchable: true,
        isSortable: true,
        field: createSystemField({
            fieldId: "savedOn",
            type: "date",
            settings: {
                type: "dateTimeWithoutTimezone"
            }
        })
    },
    createdOn: {
        type: "date",
        unmappedType: "date",
        keyword: false,
        isSystemField: true,
        isSearchable: true,
        isSortable: true,
        field: createSystemField({
            fieldId: "createdOn",
            type: "text",
            settings: {
                type: "dateTimeWithoutTimezone"
            }
        })
    },
    createdBy: {
        type: "text",
        unmappedType: undefined,
        isSystemField: true,
        isSearchable: true,
        isSortable: false,
        path: "createdBy.id",
        field: createSystemField({
            fieldId: "createdBy",
            type: "text"
        })
    },
    ownedBy: {
        type: "text",
        unmappedType: undefined,
        isSystemField: true,
        isSearchable: true,
        isSortable: false,
        path: "ownedBy.id",
        field: createSystemField({
            fieldId: "ownedBy",
            type: "text"
        })
    },
    version: {
        type: "number",
        unmappedType: undefined,
        keyword: false,
        isSystemField: true,
        isSearchable: true,
        isSortable: true,
        field: createSystemField({
            fieldId: "version",
            type: "number"
        })
    }
};

/*
 * Create an object with key fieldType and options for that field
 */
export const createModelFields = (context: CmsContext, model: CmsContentModel): ModelFields => {
    // collect all unmappedType from elastic plugins
    const unmappedTypes: UnmappedFieldTypes = context.plugins
        .byType<CmsModelFieldToElasticsearchPlugin>("cms-model-field-to-elastic-search")
        .reduce((acc, plugin) => {
            if (!plugin.unmappedType) {
                return acc;
            }
            acc[plugin.fieldType] = plugin.unmappedType;
            return acc;
        }, {});
    /**
     * collect all field types from the plugins
     */
    const fieldTypePlugins: FieldTypePlugins = context.plugins
        .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
        .reduce((types, plugin) => {
            const { fieldType, isSearchable, isSortable } = plugin;
            types[fieldType] = {
                unmappedType: unmappedTypes[fieldType],
                isSearchable: isSearchable === true,
                isSortable: isSortable === true
            };
            return types;
        }, {});

    return model.fields.reduce((fields, field) => {
        const { fieldId, type } = field;
        if (!fieldTypePlugins[type]) {
            throw new WebinyError(`There is no plugin for field type "${type}".`);
        }
        const { isSearchable, isSortable, unmappedType } = fieldTypePlugins[type];
        fields[fieldId] = {
            type,
            isSearchable,
            isSortable,
            unmappedType: typeof unmappedType === "function" ? unmappedType(field) : undefined,
            isSystemField: false,
            field
        };

        return fields;
    }, systemFields);
};
