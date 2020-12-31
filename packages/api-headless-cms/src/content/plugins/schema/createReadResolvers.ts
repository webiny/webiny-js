import {
    CmsContentModelType,
    CmsFieldTypePlugins,
    CmsContext,
    CmsContentEntryType
} from "@webiny/api-headless-cms/types";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { createReadTypeName, createTypeName } from "../utils/createTypeName";
import { commonFieldResolvers } from "../utils/commonFieldResolvers";
import { resolveGet } from "../utils/resolvers/resolveGet";
import { resolveList } from "../utils/resolvers/resolveList";
import { pluralizedTypeName } from "../utils/pluralizedTypeName";
import { entryFromStorageMapperFactory } from "../utils/entryStorageMapperFactory";

export interface CreateReadResolvers {
    (params: {
        models: CmsContentModelType[];
        model: CmsContentModelType;
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
                const cacheKey = `${model.modelId}:${entry.id}:${field.fieldId}`;
                ctx.resolvedValues.set(cacheKey, value);
                // eg. decompression from storage
                const fromStorage = entryFromStorageMapperFactory(ctx, model);
                if (!fromStorage) {
                    return value;
                }
                const { values } = await fromStorage(({
                    values: {
                        [field.fieldId]: value
                    }
                } as unknown) as CmsContentEntryType);

                return values[field.fieldId];
            };

            return resolvers;
        }, resolvers)
    };
};
