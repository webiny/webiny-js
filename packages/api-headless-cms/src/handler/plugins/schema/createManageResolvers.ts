import pluralize from "pluralize";
import { CmsModel, CmsFieldTypePlugins, CmsContext } from "@webiny/api-headless-cms/types";
import { createManageTypeName, createTypeName } from "../utils/createTypeName";
import { commonFieldResolvers } from "../utils/commonFieldResolvers";
import { resolveGet } from "../utils/resolvers/resolveGet";
import { resolveList } from "../utils/resolvers/resolveList";
import { resolveCreate } from "../utils/resolvers/resolveCreate";
import { resolveUpdate } from "../utils/resolvers/resolveUpdate";
import { resolveDelete } from "../utils/resolvers/resolveDelete";
import { resolvePublish } from "../utils/resolvers/resolvePublish";
import { resolveUnpublish } from "../utils/resolvers/resolveUnpublish";
import { resolveCreateFrom } from "../utils/resolvers/resolveCreateFrom";

export interface CreateManageResolvers {
    (params: {
        models: CmsModel[];
        model: CmsModel;
        context: CmsContext;
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
        Query: {
            [`get${typeName}`]: resolveGet({ model }),
            [`list${pluralize(typeName)}`]: resolveList({ model })
        },
        Mutation: {
            [`create${typeName}`]: resolveCreate({ model }),
            [`update${typeName}`]: resolveUpdate({ model }),
            [`delete${typeName}`]: resolveDelete({ model }),
            [`publish${typeName}`]: resolvePublish({ model }),
            [`unpublish${typeName}`]: resolveUnpublish({ model }),
            [`create${typeName}From`]: resolveCreateFrom({ model })
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
