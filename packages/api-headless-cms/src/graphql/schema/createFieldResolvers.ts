import set from "lodash/set.js";
import type { Resolvers } from "@webiny/handler-graphql/types.js";
import WebinyError from "@webiny/error";
import type { ApiEndpoint, CmsContext, CmsModel, CmsModelField } from "~/types/index.js";
import { entryFieldFromStorageTransform } from "~/utils/entryStorage.js";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";
import type {
    CmsModelFieldToGraphQL,
    CmsModelFieldToGraphQLRegistry
} from "~/features/graphql/index.js";

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
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
}

/**
 * We use a factory to avoid passing the parameters for recursive invocations.
 * This way they will always be in the function scope, and we can only pass "fields".
 */
export const createFieldResolversFactory = (factoryParams: CreateFieldResolversFactoryParams) => {
    const { endpointType, models, model, fieldRegistry } = factoryParams;
    return function createFieldResolvers(params: CreateFieldResolvers) {
        const { graphQLType, fields, isRoot = false, extraResolvers = {} } = params;

        const fieldResolvers: Resolvers<any> = {};
        const typeResolvers = {};

        for (const field of fields) {
            const plugin = fieldRegistry.get(getBaseFieldType(field));
            if (!plugin) {
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

            const api: CmsModelFieldToGraphQL.ReadApi | CmsModelFieldToGraphQL.ManageApi =
                endpointType === "manage" ? plugin.manage : plugin.read;
            const createResolver = api?.createResolver || null;

            let resolver: any;
            const fieldResolver = createResolver
                ? createResolver({
                      graphQLType,
                      models,
                      model,
                      field,
                      createFieldResolvers,
                      fieldRegistry
                  })
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
            /**
             * Figure out a better way to extract value from parent.
             * // TODO fix
             */
            const getValue = (parent: any) => {
                if (!parent?.values || !parent?.values[fieldId]) {
                    return {
                        isRoot: false,
                        value: parent?.[fieldId]
                    };
                }
                return {
                    isRoot: true,
                    value: parent.values[fieldId]
                };
            };

            fieldResolvers[fieldId] = async (parent, args, context: CmsContext, info) => {
                /**
                 * This is required because due to ref field can be requested without the populated data.
                 * At that point there is no .values  no fieldId property on the parent
                 */
                const { isRoot: valueIsRoot, value } = getValue(parent);
                if (value === undefined) {
                    return undefined;
                }
                // Get transformed value (eg. data decompression)
                const transformedValue = await entryFieldFromStorageTransform({
                    context,
                    model,
                    field,
                    value
                });

                set(
                    valueIsRoot && parent.values ? parent.values : parent,
                    fieldId,
                    transformedValue
                );

                if (!resolver) {
                    return valueIsRoot && parent.values[fieldId]
                        ? parent.values[fieldId]
                        : parent[fieldId];
                }

                return await resolver(valueIsRoot ? parent.values : parent, args, context, info);
            };
        }

        /**
         * Difference between root and non-root (object and dz, etc... fields) is that root has a values wrapper.
         * Subtypes must not have it.
         */
        if (!isRoot) {
            return {
                [graphQLType]: {
                    ...fieldResolvers,
                    ...extraResolvers
                },
                ...typeResolvers
            };
        }

        return {
            [graphQLType]: {
                ...extraResolvers
            },
            [`${graphQLType}Values`]: fieldResolvers,
            ...typeResolvers
        };
    };
};
