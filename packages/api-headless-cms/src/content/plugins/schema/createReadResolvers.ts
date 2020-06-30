import pluralize from "pluralize";
import { CmsContentModel, CmsFieldTypePlugins, CmsContext } from "@webiny/api-headless-cms/types";
import { hasScope } from "@webiny/api-security";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { createReadTypeName, createTypeName } from "../utils/createTypeName";
import { commonFieldResolvers } from "../utils/commonFieldResolvers";
import { resolveGet } from "../utils/resolvers/resolveGet";
import { resolveList } from "../utils/resolvers/resolveList";

export interface CreateReadResolvers {
    (params: {
        models: CmsContentModel[];
        model: CmsContentModel;
        context: CmsContext;
        fieldTypePlugins: CmsFieldTypePlugins;
    }): any;
}

export const createReadResolvers: CreateReadResolvers = ({
    models,
    model,
    fieldTypePlugins,
    context
}) => {
    const typeName = createTypeName(model.modelId);
    const rTypeName = createReadTypeName(typeName);

    const resolvers: { [key: string]: GraphQLFieldResolver } = commonFieldResolvers();

    const apiType = context.cms.READ ? "read" : "preview";
    const environment = context.cms.getEnvironment().id; // TODO [Andrei] use .slug here
    const scope = `cms:${apiType}:${environment}:${model.modelId}`;

    // TODO [Andrei] [later]: test scopes
    console.log("scope = ");
    console.log("");
    console.log("");
    console.log(scope);

    return {
        Query: {
            [`get${typeName}`]: hasScope(scope)(resolveGet({ model })),
            [`list${pluralize(typeName)}`]: hasScope(scope)(resolveList({ model }))
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
