import gql from "graphql-tag";
import WebinyError from "@webiny/error";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { ListModelsUseCase } from "~/features/contentModel/ListModels/index.js";
import type { CmsContext, CmsModel, CmsModelField } from "~/types/index.js";
import type { ValidateChildFieldsValidate } from "~/features/graphql/fields/abstractions/CmsModelFieldToGraphQL.js";
import { createManageSDL } from "~/graphql/schema/createManageSDL.js";
import { createFieldStorageId } from "../createFieldStorageId.js";
import type { GraphQLError } from "graphql";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";
import { getContentModelTitleFieldId } from "./fields/titleField.js";
import { getContentModelDescriptionFieldId } from "./fields/descriptionField.js";
import { getContentModelImageFieldId } from "./fields/imageField.js";
import type { ICmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import { buildSchemaPlugins } from "~/graphql/buildSchemaPlugins.js";
import { HeadlessCms } from "~/features/shared/abstractions.js";
import { CmsGraphQLSchemaFactory } from "~/graphql/CmsGraphQLSchemaFactory.js";
import { createExecutableSchema } from "~/graphql/createExecutableSchema.js";
import {
    CmsGraphQLSchemaSorter,
    CmsModelFieldToGraphQLRegistry
} from "~/features/graphql/index.js";

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
    registry: CmsModelFieldToGraphQLRegistry.Interface
): ValidateChildFieldsValidate => {
    return ({ fields, originalFields }) => {
        if (fields.length === 0 && originalFields.length === 0) {
            return;
        }
        validateFields({
            fields,
            originalFields,
            registry
        });
    };
};

interface ValidateFieldsParams {
    registry: CmsModelFieldToGraphQLRegistry.Interface;
    fields: CmsModelField[];
    originalFields: CmsModelField[];
}

const validateFields = (params: ValidateFieldsParams) => {
    const { registry, fields, originalFields } = params;

    const idList: string[] = [];
    const fieldIdList: string[] = [];
    const storageIdList: string[] = [];

    for (const field of fields) {
        const baseType = getBaseFieldType(field);
        const fieldImpl = registry.get(baseType);

        if (!fieldImpl) {
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
        if (!field.storageId) {
            /**
             * When having an original field, set the storageId to value from the originalField
             */
            if (originalField) {
                field.storageId = originalField.storageId;
            } else {
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
        if (!fieldImpl.validateChildFields) {
            continue;
        }
        const validateChildFields = createValidateChildFields(registry);
        fieldImpl.validateChildFields({
            field,
            originalField,
            validate: validateChildFields
        });
    }
};

interface CreateGraphQLSchemaParams {
    context: CmsContext;
    model: CmsModel;
}

const createGraphQLSchema = async (params: CreateGraphQLSchemaParams): Promise<any> => {
    const { context, model } = params;

    const modelsResult = await context.container
        .resolve(IdentityContext)
        .withoutAuthorization(async () => {
            return context.container.resolve(ListModelsUseCase).execute();
        });
    if (modelsResult.isFail()) {
        throw modelsResult.error;
    }
    const models = modelsResult.value.filter(
        (model): model is CmsModel => model.isPrivate !== true
    );

    const generatedSchemaPlugins = await buildSchemaPlugins({
        context,
        /**
         * Must remove the current model from the list, as we are possibly updating it - there would be two if we didn't.
         */
        models: models.filter(m => m.modelId !== model.modelId).concat([model]),
        type: context.container.resolve(HeadlessCms).type
    });

    /**
     * The base CMS GraphQL types (CmsError, CmsIdentity, entry options, etc.) are provided
     * by the CmsGraphQLSchemaFactory implementations registered in the DI container — mirror
     * generateSchema() so model validation builds against the same complete type set.
     */
    const staticFactories = context.container.resolveAll(CmsGraphQLSchemaFactory);
    const staticPlugins: ICmsGraphQLSchemaPlugin[] = [];
    for (const factory of staticFactories) {
        staticPlugins.push(...(await factory.execute()));
    }

    const schemaPlugins = [...staticPlugins, ...generatedSchemaPlugins].filter(pl => {
        if (typeof pl.isApplicable === "function") {
            return pl.isApplicable(context);
        }
        return true;
    });

    return createExecutableSchema({ plugins: schemaPlugins });
};

const extractErrorObject = (error: any) => {
    return ["message", "code", "data", "stack"].reduce<Record<string, any>>((output, key) => {
        if (!error[key]) {
            return output;
        }
        output[key] = error[key];
        return output;
    }, {});
};

interface ValidateModelFieldsParams {
    models: CmsModel[];
    model: CmsModel;
    original?: CmsModel;
    context: CmsContext;
}

export const validateModelFields = async (params: ValidateModelFieldsParams): Promise<void> => {
    const { models, model, original, context } = params;
    const { titleFieldId, descriptionFieldId, imageFieldId } = model;

    /**
     * There should be fields/locked fields in either model or data to be updated.
     */
    const { fields = [] } = model;

    /**
     * Let's inspect the fields of the received content model. We prevent saving of a content model if it
     * contains a field for which a "cms-model-field-to-graphql" plugin does not exist on the backend.
     */
    const fieldRegistry = context.container.resolve(CmsModelFieldToGraphQLRegistry);
    const sorters = context.container.resolveAll(CmsGraphQLSchemaSorter);

    validateFields({
        fields,
        originalFields: original?.fields || [],
        registry: fieldRegistry
    });

    if (fields.length) {
        /**
         * Make sure that this model can be safely converted to a GraphQL SDL
         */
        const schema = createManageSDL({
            models,
            model,
            fieldRegistry,
            sorters
        });

        try {
            gql(schema);
        } catch (err) {
            throw new WebinyError(extractInvalidField(model, err));
        }
        /**
         *
         */
        try {
            await createGraphQLSchema({
                context,
                model
            });
        } catch (err) {
            throw new WebinyError({
                message:
                    "Cannot generate GraphQL schema when testing with the given model. Please check the response for more details.",
                code: "GRAPHQL_SCHEMA_ERROR",
                data: {
                    modelId: model.modelId,
                    error: extractErrorObject(err)
                }
            });
        }
    }

    model.titleFieldId = getContentModelTitleFieldId(fields, titleFieldId);
    model.descriptionFieldId = getContentModelDescriptionFieldId(fields, descriptionFieldId);
    model.imageFieldId = getContentModelImageFieldId(fields, imageFieldId);
};
