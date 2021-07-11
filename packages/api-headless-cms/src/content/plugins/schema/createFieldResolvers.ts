import get from "lodash/get";
import set from "lodash/set";
import { CmsContentModelField, CmsContext, CmsModelFieldToGraphQLCreateResolver } from "~/types";
import { entryFieldFromStorageTransform } from "~/content/plugins/utils/entryStorage";
import { Resolvers } from "@webiny/handler-graphql/types";

interface CreateFieldResolvers {
    graphQLType: string;
    fields: CmsContentModelField[];
    isRoot: boolean;
    extraResolvers?: Resolvers<any>;
}

/**
 * We use a factory to avoid passing the parameters for recursive invocations.
 * This way they will always be in the function scope and we can only pass "fields".
 */
export function createFieldResolversFactory({ endpointType, models, model, fieldTypePlugins }) {
    return function createFieldResolvers(params: CreateFieldResolvers) {
        const { graphQLType, fields, isRoot = false, extraResolvers = {} } = params;

        const fieldResolvers = { ...extraResolvers };
        const typeResolvers = {};

        for (const field of fields) {
            if (!fieldTypePlugins[field.type]) {
                continue;
            }

            const createResolver: CmsModelFieldToGraphQLCreateResolver = get(
                fieldTypePlugins,
                `${field.type}.${endpointType}.createResolver`
            );

            let resolver;
            const fieldResolver = createResolver
                ? createResolver({ graphQLType, models, model, field, createFieldResolvers })
                : null;

            if (typeof fieldResolver === "function") {
                resolver = fieldResolver;
            } else if (fieldResolver !== null) {
                resolver = fieldResolver.resolver;
                Object.assign(typeResolvers, fieldResolver.typeResolvers);
            }

            const { fieldId } = field;

            fieldResolvers[fieldId] = async (parent, args, context: CmsContext, info) => {
                try {
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
                } catch(err) {
                    const a = err;
                }
            };
        }

        return { [graphQLType]: fieldResolvers, ...typeResolvers };
    };
}
