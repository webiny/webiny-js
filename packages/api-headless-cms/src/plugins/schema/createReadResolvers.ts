import pluralize from "pluralize";
import { CmsModel, CmsFieldTypePlugins } from "@webiny/api-headless-cms/types";
import { GraphQLContext, GraphQLFieldResolver } from "@webiny/api/types";
import { createReadTypeName, createTypeName } from "../utils/createTypeName";
import { commonFieldResolvers } from "../utils/commonFieldResolvers";
import { resolveGet } from "../utils/resolveGet";
import { resolveList } from "../utils/resolveList";

export interface CreateReadResolvers {
    (params: {
        models: CmsModel[];
        model: CmsModel;
        context: GraphQLContext;
        fieldTypePlugins: CmsFieldTypePlugins;
    }): any;
}

export const createReadResolvers: CreateReadResolvers = ({ models, model, fieldTypePlugins }) => {
    const typeName = createTypeName(model.modelId);
    const rTypeName = createReadTypeName(typeName);

    const resolvers: { [key: string]: GraphQLFieldResolver } = commonFieldResolvers();

    return {
        CmsReadQuery: {
            [`get${typeName}`]: resolveGet({ model })
            //[`list${pluralize(typeName)}`]: resolveList({ model })
        },
        [rTypeName]: model.fields.reduce((resolvers, field) => {
            const { read } = fieldTypePlugins[field.type];
            const resolver = read.createResolver({ models, model, field });

            resolvers[field.fieldId] = async (entry, args, ctx, info) => {
                // If field-level locale is not specified, use context locale.
                const locale = args.locale || ctx.cms.locale.code;
                const value = await resolver(entry, { ...args, locale }, ctx, info);
                const cacheKey = `${model.modelId}:${entry.id}:${field.fieldId}`;
                ctx.resolvedValues.set(cacheKey, value);
                return value;
            };

            return resolvers;
        }, resolvers)
    };
};
