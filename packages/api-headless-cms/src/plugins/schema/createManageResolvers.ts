import pluralize from "pluralize";
import { CmsModel, CmsFieldTypePlugins } from "@webiny/api-headless-cms/types";
import { GraphQLContext } from "@webiny/api/types";
import { createManageTypeName, createTypeName } from "../utils/createTypeName";
import { commonFieldResolvers } from "../utils/commonFieldResolvers";
import { resolveGet } from "../utils/resolveGet";
import { resolveList } from "../utils/resolveList";
import { resolveCreate } from "../utils/resolveCreate";
import { resolveUpdate } from "../utils/resolveUpdate";
import { resolveDelete } from "../utils/resolveDelete";

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
            [`get${typeName}`]: resolveGet({ model }),
            [`list${pluralize(typeName)}`]: resolveList({ model })
        },
        CmsManageMutation: {
            [`create${typeName}`]: resolveCreate({ model }),
            [`update${typeName}`]: resolveUpdate({ model }),
            [`delete${typeName}`]: resolveDelete({ model })
        },
        [mTypeName]: model.fields.reduce((resolvers, field) => {
            const { manage } = fieldTypePlugins[field.type];
            const resolver = manage.createResolver({ models, model, field });

            resolvers[field.fieldId] = async (entry, args, ctx, info) => {
                // If field-level locale is not specified, use context locale.
                const locale = args.locale || ctx.cms.locale.code;
                return await resolver(entry, { ...args, locale }, ctx, info);
            };

            return resolvers;
        }, commonFieldResolvers())
    };
};
