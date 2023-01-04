import set from "lodash/set";
import {
    CmsModelField,
    CmsContext,
    CmsModelFieldToGraphQLCreateResolver,
    ApiEndpoint,
    CmsModel,
    CmsFieldTypePlugins
} from "~/types";
import { entryFieldFromStorageTransform } from "~/utils/entryStorage";
import { Resolvers } from "@webiny/handler-graphql/types";
import WebinyError from "@webiny/error";
import { getBaseFieldType } from "~/utils/getBaseFieldType";

interface CreateFieldResolvers {
    graphQLType: string;
    fields: CmsModelField[];
    isRoot: boolean;
    extraResolvers?: Resolvers<any>;
}

interface CreateFieldResolversFactoryParams {
    endpointType: ApiEndpoint;
    models: CmsModel[];
    model: CmsModel;
    fieldTypePlugins: CmsFieldTypePlugins;
}

const getCreateResolver = (
    plugins: CmsFieldTypePlugins,
    field: CmsModelField,
    endpointType: ApiEndpoint
): CmsModelFieldToGraphQLCreateResolver | null => {
    const baseType = getBaseFieldType(field);
    if (!plugins[baseType]) {
        return null;
    } else if (!plugins[baseType][endpointType]) {
        return null;
    }
    return plugins[baseType][endpointType].createResolver;
};
/**
 * We use a factory to avoid passing the parameters for recursive invocations.
 * This way they will always be in the function scope, and we can only pass "fields".
 */
export const createFieldResolversFactory = (factoryParams: CreateFieldResolversFactoryParams) => {
    const { endpointType, models, model, fieldTypePlugins } = factoryParams;
    return function createFieldResolvers(params: CreateFieldResolvers) {
        const { graphQLType, fields, isRoot = false, extraResolvers = {} } = params;

        const fieldResolvers = { ...extraResolvers };
        const typeResolvers = {};

        for (const field of fields) {
            if (!fieldTypePlugins[getBaseFieldType(field)]) {
                continue;
            }
            /**
             * Field that is passed into this factory MUST have fieldId, so filter it before the method call.
             */
            if (!field.fieldId) {
                throw new WebinyError(
                    "Field is missing an `fieldId`. Cannot process field without the `fieldId` in the resolvers.",
                    "FIELD_ID_ERROR",
                    {
                        field
                    }
                );
            }

            const createResolver = getCreateResolver(fieldTypePlugins, field, endpointType);

            let resolver: any;
            const fieldResolver = createResolver
                ? createResolver({ graphQLType, models, model, field, createFieldResolvers })
                : null;

            /**
             * When fieldResolver is false it will completely skip adding field fieldId into the resolvers.
             * This is to fix the breaking of GraphQL schema.
             */
            if (fieldResolver === false) {
                continue;
            } else if (typeof fieldResolver === "function") {
                resolver = fieldResolver;
            } else if (fieldResolver) {
                resolver = fieldResolver.resolver;
                Object.assign(typeResolvers, fieldResolver.typeResolvers);
            }

            const { fieldId } = field;
            // TODO @ts-refactor figure out types for parameters
            // @ts-ignore
            fieldResolvers[fieldId] = async (parent, args, context: CmsContext, info) => {
                // Get transformed value (eg. data decompression)
                const transformedValue = await entryFieldFromStorageTransform({
                    context,
                    model,
                    field,
                    value: isRoot ? parent.values[fieldId] : parent[fieldId]
                });

                set(isRoot ? parent.values : parent, fieldId, transformedValue);

                if (!resolver) {
                    return isRoot ? parent.values[fieldId] : parent[fieldId];
                }

                return await resolver(isRoot ? parent.values : parent, args, context, info);
            };
        }

        return { [graphQLType]: fieldResolvers, ...typeResolvers };
    };
};
