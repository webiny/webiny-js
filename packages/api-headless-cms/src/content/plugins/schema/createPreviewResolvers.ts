import { CmsContentModel, CmsFieldTypePlugins, CmsContext } from "../../../types";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { commonFieldResolvers } from "./resolvers/commonFieldResolvers";
import { resolveGet } from "./resolvers/preview/resolveGet";
import { resolveList } from "./resolvers/preview/resolveList";
import { createReadTypeName, createTypeName } from "../utils/createTypeName";
import { pluralizedTypeName } from "../utils/pluralizedTypeName";
import { entryFieldFromStorageTransform } from "../utils/entryStorage";

interface CreatePreviewResolvers {
    (params: {
        models: CmsContentModel[];
        model: CmsContentModel;
        context: CmsContext;
        fieldTypePlugins: CmsFieldTypePlugins;
    }): any;
}

export const createPreviewResolvers: CreatePreviewResolvers = ({
    models,
    model,
    fieldTypePlugins
}) => {
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

            const resolver = read.createResolver
                ? read.createResolver({ models, model, field })
                : null;

            resolvers[field.fieldId] = async (entry, args, context: CmsContext, info) => {
                // Get transformed value (eg. data decompression)
                entry.values[field.fieldId] = await entryFieldFromStorageTransform({
                    context,
                    model,
                    entry,
                    field,
                    value: entry.values[field.fieldId]
                });
                if (!resolver) {
                    return entry.values[field.fieldId];
                }
                return await resolver(entry, args, context, info);
            };

            return resolvers;
        }, resolvers)
    };
};
