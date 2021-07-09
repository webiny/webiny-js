import get from "lodash/get";
import set from "lodash/set";
import { CmsContentModelField, CmsContext, CmsModelFieldToGraphQLCreateResolver } from "~/types";
import { entryFieldFromStorageTransform } from "~/content/plugins/utils/entryStorage";
import { Resolvers } from "@webiny/handler-graphql/types";

interface CreateFieldResolvers {
    graphQLType: string;
    fields: CmsContentModelField[];
    parentPath?: string;
    extraResolvers?: Resolvers<any>;
}

/**
 * We use a factory to avoid passing the parameters for recursive invocations.
 * This way they will always be in the function scope and we can only pass "fields".
 */
export function createFieldResolversFactory({ endpointType, models, model, fieldTypePlugins }) {
    return function createFieldResolvers(params: CreateFieldResolvers) {
        const { graphQLType, fields, extraResolvers = {}, parentPath } = params;

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

            fieldResolvers[field.fieldId] = async (
                parent,
                args,
                context: CmsContext,
                info
            ) => {
                // Get transformed value (eg. data decompression)
                const { values } = await entryFieldFromStorageTransform({
                    context,
                    model,
                    field,
                    fieldPath: field.fieldId,
                    getValue(fieldPath) {
                        return get(parent.values, fieldPath);
                    }
                });
                
                Object.keys(values).forEach(key => {
                    set(parent.values, key, values[key]);
                })


                if (!resolver) {
                    return parent.values[field.fieldId];
                }

                /**
                 * We need to pass the entire entry, but also isolated "parent" value (for nested objects).
                 */
                return await resolver({ entry: parent, parent: parent.values, args, context, info, field });
            };
        }

        return { [graphQLType]: fieldResolvers, ...typeResolvers };
    };
}
