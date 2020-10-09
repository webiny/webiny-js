import { CmsContentModel, CmsFieldTypePlugins, CmsContext } from "@webiny/api-headless-cms/types";
import { hasCmsPermission } from "@webiny/api-security";
import { createManageTypeName, createTypeName } from "../utils/createTypeName";
import { commonFieldResolvers } from "../utils/commonFieldResolvers";
import { resolveGet } from "../utils/resolvers/resolveGet";
import { resolveList } from "../utils/resolvers/resolveList";
import { resolveCreate } from "../utils/resolvers/manage/resolveCreate";
import { resolveUpdate } from "../utils/resolvers/manage/resolveUpdate";
import { resolveDelete } from "../utils/resolvers/manage/resolveDelete";
import { resolvePublish } from "../utils/resolvers/manage/resolvePublish";
import { resolveUnpublish } from "../utils/resolvers/manage/resolveUnpublish";
import { resolveCreateFrom } from "../utils/resolvers/manage/resolveCreateFrom";
import { pluralizedTypeName } from "../utils/pluralizedTypeName";

const createPermissionChecker = (checker, model) => {
    return ({ args, context, permission }) => {
        return checker({ args, context, permission, model });
    };
};

const checkContentEntryUpdatePermission = async ({ context, permission, model }) => {
    let allowed = true;
    const { CmsContentModelGroup } = context.models;
    const identity = context.security.getIdentity();

    if (allowed && permission.own) {
        // Check if the model is created by the user
        allowed = model.createdBy === identity.id;
    }

    if (allowed && Array.isArray(permission.models) && permission.models.length) {
        allowed = permission.models.includes(model.modelId);
    }

    if (allowed && Array.isArray(permission.groups) && permission.groups.length) {
        const contentModelGroupData = await CmsContentModelGroup.find({
            query: { slug: { $in: permission.groups } }
        });

        if (Array.isArray(contentModelGroupData)) {
            const contentModelGroup = await model.group;

            allowed = contentModelGroupData.some(item => item.id === contentModelGroup.id);
        }
    }

    return allowed;
};

export interface CreateManageResolvers {
    (params: {
        models: CmsContentModel[];
        model: CmsContentModel;
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
            [`list${pluralizedTypeName(typeName)}`]: resolveList({ model })
        },
        Mutation: {
            [`create${typeName}`]: hasCmsPermission(
                "cms.manage.contentEntry.update",
                createPermissionChecker(checkContentEntryUpdatePermission, model)
            )(resolveCreate({ model })),
            [`update${typeName}`]: hasCmsPermission(
                "cms.manage.contentEntry.update",
                createPermissionChecker(checkContentEntryUpdatePermission, model)
            )(resolveUpdate({ model })),
            [`delete${typeName}`]: hasCmsPermission(
                "cms.manage.contentEntry.delete",
                createPermissionChecker(checkContentEntryUpdatePermission, model)
            )(resolveDelete({ model })),
            [`publish${typeName}`]: hasCmsPermission(
                "cms.manage.contentEntry.publish",
                createPermissionChecker(checkContentEntryUpdatePermission, model)
            )(resolvePublish({ model })),
            [`unpublish${typeName}`]: hasCmsPermission(
                "cms.manage.contentEntry.publish",
                createPermissionChecker(checkContentEntryUpdatePermission, model)
            )(resolveUnpublish({ model })),
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
