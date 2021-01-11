import { CmsContentModel, CmsFieldTypePlugins, CmsContext } from "@webiny/api-headless-cms/types";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { createReadTypeName, createTypeName } from "../utils/createTypeName";
import { commonFieldResolvers } from "./resolvers/commonFieldResolvers";
import { resolveGet } from "./resolvers/read/resolveGet";
import { resolveList } from "./resolvers/read/resolveList";
import { pluralizedTypeName } from "../utils/pluralizedTypeName";
import { entryFieldFromStorageTransform } from "../utils/entryStorage";

export interface CreateReadResolvers {
    (params: {
        models: CmsContentModel[];
        model: CmsContentModel;
        context: CmsContext;
        fieldTypePlugins: CmsFieldTypePlugins;
    }): any;
}

export const createReadResolvers: CreateReadResolvers = ({ models, model, fieldTypePlugins }) => {
    const typeName = createTypeName(model.modelId);
    const rTypeName = createReadTypeName(typeName);

    const resolvers: { [key: string]: GraphQLFieldResolver } = commonFieldResolvers();

    return {
        Query: {
            [`get${typeName}`]: resolveGet({ model }),
            [`list${pluralizedTypeName(typeName)}`]: resolveList({ model })
        },
        [rTypeName]: model.fields.reduce((resolvers, field) => {
            const { read } = fieldTypePlugins[field.type];
            const resolver = read.createResolver({ models, model, field });

            resolvers[field.fieldId] = async (entry, args, ctx: CmsContext, info) => {
                const value = await resolver(entry, args, ctx, info);

                // Get transformed value (eg. data decompression)
                return entryFieldFromStorageTransform({
                    context: ctx,
                    model,
                    entry,
                    field,
                    value
                });
            };

            return resolvers;
        }, resolvers)
    };
};
