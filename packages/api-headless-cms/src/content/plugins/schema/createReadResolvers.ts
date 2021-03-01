import { CmsContentModel, CmsFieldTypePlugins, CmsContext } from "../../../types";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { createReadTypeName, createTypeName } from "../utils/createTypeName";
import { commonFieldResolvers } from "./resolvers/commonFieldResolvers";
import { resolveGet } from "./resolvers/read/resolveGet";
import { resolveList } from "./resolvers/read/resolveList";
import { pluralizedTypeName } from "../utils/pluralizedTypeName";
import { entryFieldFromStorageTransform } from "../utils/entryStorage";

interface CreateReadResolvers {
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
