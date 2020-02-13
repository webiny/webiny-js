import pluralize from "pluralize";
import { CmsModel, CmsFieldTypePlugins } from "@webiny/api-headless-cms/types";
import { GraphQLContext } from "@webiny/api/types";
import { emptyResolver } from "@webiny/commodo-graphql";
import { createManageTypeName, createTypeName } from "../utils/createTypeName";
import { commonFieldResolvers } from "../utils/commonFieldResolvers";
import { resolveGet } from "../utils/resolveGet";
import { resolveList } from "../utils/resolveList";
import { resolveCreate } from "../utils/resolveCreate";
import { resolveUpdate } from "../utils/resolveUpdate";

export interface CreateManageResolvers {
    (params: {
        models: CmsModel[];
        model: CmsModel;
        context: GraphQLContext;
        fieldTypePlugins: CmsFieldTypePlugins;
    }): any;
}

export const createManageResolvers: CreateManageResolvers = ({
    models,
    model,
    fieldTypePlugins
}) => {
    const typeName = createTypeName(model.modelId);
    const mTypeName = createManageTypeName(typeName);

    return {
        CmsManageQuery: {
            [`get${typeName}`]: resolveGet({ models, model }),
            [`list${pluralize(typeName)}`]: resolveList({ models, model })
        },
        CmsManageMutation: {
            [`create${typeName}`]: resolveCreate({ models, model }),
            [`update${typeName}`]: resolveUpdate({ models, model }),
            [`delete${typeName}`]: emptyResolver // TODO
        },
        [mTypeName]: model.fields.reduce((resolvers, field) => {
            const { manage } = fieldTypePlugins[field.type];
            let resolver = (entry, args, ctx, info) => entry[info.fieldName];
            if (typeof manage.createResolver === "function") {
                resolver = manage.createResolver({ models, model, field });
            }

            resolvers[field.fieldId] = (entry, args, ctx, info) => {
                return resolver(entry, args, ctx, info);
            };

            return resolvers;
        }, commonFieldResolvers())
    };
};
