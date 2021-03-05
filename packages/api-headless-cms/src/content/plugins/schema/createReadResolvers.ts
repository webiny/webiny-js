import { CmsContentModel, CmsFieldTypePlugins, CmsContext } from "../../../types";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { createReadTypeName, createTypeName } from "../utils/createTypeName";
import { commonFieldResolvers } from "./resolvers/commonFieldResolvers";
import { resolveGet } from "./resolvers/read/resolveGet";
import { resolveList } from "./resolvers/read/resolveList";
import { pluralizedTypeName } from "../utils/pluralizedTypeName";
import { entryFieldFromStorageTransform } from "../utils/entryStorage";
import get from "lodash/get";

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
            // Every time a client updates content model's fields, we check the type of each field. If a field plugin
            // for a particular "field.type" doesn't exist on the backend yet, we throw an error. But still, we also
            // want to be careful when accessing the field plugin here too. It is still possible to have a content model
            // that contains a field, for which we don't have a plugin registered on the backend. For example, user
            // could've just removed the plugin from the backend.
            const createResolver = get(fieldTypePlugins, `${field.type}.read.createResolver`);

            const resolver = createResolver ? createResolver({ models, model, field }) : null;

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
