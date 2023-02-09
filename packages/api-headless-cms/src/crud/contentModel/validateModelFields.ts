import {
    CmsModel,
    CmsModelField,
    CmsModelFieldToGraphQLPlugin,
    CmsModelFieldToGraphQLPluginValidateChildFieldsValidate,
    CmsModelLockedFieldPlugin,
    LockedField
} from "~/types";
import WebinyError from "@webiny/error";
import { createManageSDL } from "~/graphql/schema/createManageSDL";
import gql from "graphql-tag";
import { PluginsContainer } from "@webiny/plugins";
import { createFieldStorageId } from "./createFieldStorageId";
import { GraphQLError } from "graphql";
import { getBaseFieldType } from "~/utils/getBaseFieldType";
import { CmsGraphQLSchemaSorterPlugin } from "~/plugins";

const defaultTitleFieldId = "id";

const allowedTitleFieldTypes = ["text", "number"];

const getContentModelTitleFieldId = (fields: CmsModelField[], titleFieldId?: string): string => {
    /**
     * If there are no fields defined, we will return the default field
     */
    if (fields.length === 0) {
        return defaultTitleFieldId;
    }
    /**
     * if there is no title field defined either in input data or existing content model data
     * we will take first text field that has no multiple values enabled
     * or if initial titleFieldId is the default one also try to find first available text field
     */
    if (!titleFieldId || titleFieldId === defaultTitleFieldId) {
        const titleField = fields.find(field => {
            return getBaseFieldType(field) === "text" && !field.multipleValues;
        });
        return titleField?.fieldId || defaultTitleFieldId;
    }
    /**
     * check existing titleFieldId for existence in the model
     * for correct type
     * and that it is not multiple values field
     */
    const target = fields.find(f => f.fieldId === titleFieldId);
    if (!target) {
        throw new WebinyError(
            `Field selected for the title field does not exist in the model.`,
            "VALIDATION_ERROR",
            {
                fieldId: titleFieldId,
                fields
            }
        );
    }

    if (allowedTitleFieldTypes.includes(target.type) === false) {
        throw new WebinyError(
            `Only ${allowedTitleFieldTypes.join(
                ", "
            )} and id fields can be used as an entry title.`,
            "ENTRY_TITLE_FIELD_TYPE",
            {
                storageId: target.storageId,
                fieldId: target.fieldId,
                type: target.type
            }
        );
    }

    if (target.multipleValues) {
        throw new WebinyError(
            `Fields that accept multiple values cannot be used as the entry title.`,
            "ENTRY_TITLE_FIELD_TYPE",
            {
                storageId: target.storageId,
                fieldId: target.fieldId,
                type: target.type
            }
        );
    }

    return target.fieldId;
};

const extractInvalidField = (model: CmsModel, err: GraphQLError) => {
    const sdl = err.source?.body || "";

    /**
     * Find the invalid type
     */
    const { line: lineNumber } = err.locations
        ? err.locations[0]
        : {
              line: 0
          };
    const sdlLines = sdl.split("\n");
    let sdlLine;
    let gqlType;
    for (let i = lineNumber; i > 0; i--) {
        if (sdlLine && sdlLine.includes("type ")) {
            gqlType = sdlLine.match(/type\s+(.*?)\s+{/);
            break;
        }

        sdlLine = sdlLines[i];
    }

    let invalidField: string | undefined = undefined;
    if (Array.isArray(gqlType)) {
        const fieldRegex = new RegExp(`([^\\s+].*?):\\s+\\[?${gqlType[1]}!?\\]?`);

        const matched = sdl.match(fieldRegex);
        if (matched) {
            invalidField = matched[1];
        }
    }

    let message = `See more details in the browser console.`;
    if (invalidField) {
        message = `Please review the definition of "${invalidField}" field.`;
    }

    return {
        data: {
            modelId: model.modelId,
            sdl,
            invalidField
        },
        code: "INVALID_MODEL_DEFINITION",
        message: [`Model "${model.modelId}" was not saved!`, message].join("\n")
    };
};

const createValidateChildFields = (
    plugins: CmsModelFieldToGraphQLPlugin[]
): CmsModelFieldToGraphQLPluginValidateChildFieldsValidate => {
    return ({ fields, originalFields }) => {
        if (fields.length === 0) {
            return;
        }
        validateFields({
            fields,
            originalFields,
            plugins,
            lockedFields: []
        });
    };
};

interface ValidateFieldsParams {
    plugins: CmsModelFieldToGraphQLPlugin[];
    fields: CmsModelField[];
    originalFields: CmsModelField[];
    lockedFields: LockedField[];
}
const validateFields = (params: ValidateFieldsParams) => {
    const { plugins, fields, originalFields, lockedFields } = params;

    const idList: string[] = [];
    const fieldIdList: string[] = [];
    const storageIdList: string[] = [];

    const validateChildFields = createValidateChildFields(plugins);

    for (const field of fields) {
        const baseType = getBaseFieldType(field);
        const plugin = plugins.find(plugin => plugin.fieldType === baseType);

        if (!plugin) {
            throw new Error(
                `Cannot update content model because of the unknown "${baseType}" field.`
            );
        }
        /**
         * Check the field's id against existing ones.
         * There cannot be two fields with the same id.
         */
        if (idList.includes(field.id)) {
            throw new WebinyError(
                `Cannot update content model because field "${
                    field.storageId || field.fieldId
                }" has id "${field.id}", which is already used.`
            );
        }
        idList.push(field.id);

        const originalField = originalFields.find(f => f.id === field.id);
        /**
         * Field MUST have an fieldId defined.
         */
        if (!field.fieldId) {
            throw new WebinyError(`Field does not have an "fieldId" defined.`, "MISSING_FIELD_ID", {
                field
            });
        }
        /**
         * If storageId does not match a certain pattern, add that pattern, but only if field is not locked (used) already.
         * This is to avoid errors in the already installed systems.
         *
         * Why are we using the @?
         *
         * It is not part of special characters for the query syntax in the Lucene.
         *
         * Relevant links:
         * https://lucene.apache.org/core/3_4_0/queryparsersyntax.html
         * https://discuss.elastic.co/t/special-characters-in-field-names/10658/3
         * https://discuss.elastic.co/t/illegal-characters-in-elasticsearch-field-names/17196/2
         */
        const isLocked = lockedFields.some(lockedField => {
            return lockedField.fieldId === field.storageId || lockedField.fieldId === field.fieldId;
        });
        if (!field.storageId) {
            /**
             * In case field is locked, we must set the storageId to the fieldId value.
             * This should not happen, because we upgrade all the fields in 5.33.0, but let's have a check just in case of some upgrade miss.
             */
            //
            if (isLocked) {
                field.storageId = field.fieldId;
            }
            /**
             * When having original field, just set the storageId to value from the originalField
             */
            //
            else if (originalField) {
                field.storageId = originalField.storageId;
            }
            /**
             * The last case is when no original field and not locked - so this is a completely new field.
             */
            //
            else {
                field.storageId = createFieldStorageId(field);
            }
        }
        /**
         * Check the field's fieldId against existing ones.
         * There cannot be two fields with the same fieldId - outside world identifier.
         */
        if (fieldIdList.includes(field.fieldId)) {
            throw new WebinyError(
                `Cannot update content model because field "${field.storageId}" has fieldId "${field.fieldId}", which is already used.`
            );
        }
        fieldIdList.push(field.fieldId);
        /**
         * Check the field's storageId against the existing ones.
         * There cannot be two fields with the same storageId.
         */
        if (storageIdList.includes(field.storageId)) {
            throw new WebinyError(
                `Cannot update content model because field "${field.label}" has storageId "${field.storageId}", which is already used.`
            );
        }
        storageIdList.push(field.storageId);
        /**
         * There might be some plugins which allow child fields.
         * We use this method to validate them as well.
         */
        if (!plugin.validateChildFields) {
            continue;
        }
        plugin.validateChildFields({
            field,
            originalField,
            validate: validateChildFields
        });
    }
};

interface ValidateModelFieldsParams {
    model: CmsModel;
    original?: CmsModel;
    plugins: PluginsContainer;
}
export const validateModelFields = (params: ValidateModelFieldsParams) => {
    const { model, original, plugins } = params;
    const { titleFieldId } = model;

    /**
     * There should be fields/locked fields in either model or data to be updated.
     */
    const { fields = [], lockedFields = [] } = model;

    /**
     * Let's inspect the fields of the received content model. We prevent saving of a content model if it
     * contains a field for which a "cms-model-field-to-graphql" plugin does not exist on the backend.
     */
    const fieldTypePlugins = plugins.byType<CmsModelFieldToGraphQLPlugin>(
        "cms-model-field-to-graphql"
    );
    const sorterPlugins = plugins.byType<CmsGraphQLSchemaSorterPlugin>(
        CmsGraphQLSchemaSorterPlugin.type
    );

    validateFields({
        fields,
        originalFields: original?.fields || [],
        lockedFields,
        plugins: fieldTypePlugins
    });

    if (fields.length) {
        /**
         * Make sure that this model can be safely converted to a GraphQL SDL
         */
        const schema = createManageSDL({
            model,
            fieldTypePlugins: fieldTypePlugins.reduce(
                (acc, pl) => ({ ...acc, [pl.fieldType]: pl }),
                {}
            ),
            sorterPlugins
        });

        try {
            gql(schema);
        } catch (err) {
            throw new WebinyError(extractInvalidField(model, err));
        }
    }

    model.titleFieldId = getContentModelTitleFieldId(fields, titleFieldId);

    const cmsLockedFieldPlugins =
        plugins.byType<CmsModelLockedFieldPlugin>("cms-model-locked-field");

    /**
     * We must not allow removal or changes in fields that are already in use in content entries.
     * Locked fields still have fieldId (should be storageId) because of the old existing locked fields in the models.
     */
    for (const lockedField of lockedFields) {
        const existingField = fields.find(item => item.storageId === lockedField.fieldId);

        /**
         * Starting with 5.33.0 fields can be deleted.
         * Our UI gives a warning upon locked field deletion, but if user is managing fields through API directly - we cannot do anything.
         */
        if (!existingField) {
            continue;
            // throw new WebinyError(
            //     `Cannot remove the field "${lockedField.fieldId}" because it's already in use in created content.`,
            //     "ENTRY_FIELD_USED",
            //     {
            //         lockedField,
            //         fields
            //     }
            // );
        }

        if (lockedField.multipleValues !== existingField.multipleValues) {
            throw new WebinyError(
                `Cannot change "multipleValues" for the "${lockedField.fieldId}" field because it's already in use in created content.`,
                "ENTRY_FIELD_USED",
                {
                    reason: `"multipleValues" changed`,
                    field: existingField
                }
            );
        }

        const fieldType = getBaseFieldType(existingField);
        if (lockedField.type !== fieldType) {
            throw new WebinyError(
                `Cannot change field type for the "${lockedField.fieldId}" field because it's already in use in created content.`,
                "ENTRY_FIELD_USED",
                {
                    reason: `"type" changed`,
                    lockedFieldType: lockedField.type,
                    existingFieldType: fieldType
                }
            );
        }

        /**
         * Check `lockedField` invariant for specific field
         */
        const lockedFieldsByType = cmsLockedFieldPlugins.filter(
            pl => pl.fieldType === getBaseFieldType(lockedField)
        );
        for (const plugin of lockedFieldsByType) {
            if (typeof plugin.checkLockedField !== "function") {
                continue;
            }
            plugin.checkLockedField({
                lockedField,
                field: existingField
            });
        }
    }
};
