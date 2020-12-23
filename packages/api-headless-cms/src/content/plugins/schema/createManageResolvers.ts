import {
    CmsContentModelType,
    CmsFieldTypePlugins,
    CmsContext
} from "@webiny/api-headless-cms/types";
import { createManageTypeName, createTypeName } from "../utils/createTypeName";
import { commonFieldResolvers } from "../utils/commonFieldResolvers";
import { resolveManageGet } from "../utils/resolvers/resolveManageGet";
import { resolveList } from "../utils/resolvers/resolveList";
import { resolveCreate } from "../utils/resolvers/resolveCreate";
import { resolveUpdate } from "../utils/resolvers/resolveUpdate";
import { resolveDelete } from "../utils/resolvers/resolveDelete";
import { resolvePublish } from "../utils/resolvers/resolvePublish";
import { resolveUnpublish } from "../utils/resolvers/resolveUnpublish";
import { resolveCreateFrom } from "../utils/resolvers/resolveCreateFrom";
import { pluralizedTypeName } from "../utils/pluralizedTypeName";

// const createPermissionChecker = (checker, model) => {
//     return ({ args, context, permission }) => {
//         return checker({ args, context, permission, model });
//     };
// };
//
// const checkContentEntryUpdatePermission = async ({ context, permission, model }) => {
//     let allowed = true;
//     const { CmsContentModelGroup } = context.models;
//     const identity = context.security.getIdentity();
//
//     if (allowed && permission.own) {
//         // Check if the model is created by the user
//         allowed = model.createdBy === identity.id;
//     }
//
//     if (allowed && Array.isArray(permission.models) && permission.models.length) {
//         allowed = permission.models.includes(model.modelId);
//     }
//
//     if (allowed && Array.isArray(permission.groups) && permission.groups.length) {
//         const contentModelGroupData = await CmsContentModelGroup.find({
//             query: { slug: { $in: permission.groups } }
//         });
//
//         if (Array.isArray(contentModelGroupData)) {
//             const contentModelGroup = await model.group;
//
//             allowed = contentModelGroupData.some(item => item.id === contentModelGroup.id);
//         }
//     }
//
//     return allowed;
// };

export interface CreateManageResolvers {
    (params: {
        models: CmsContentModelType[];
        model: CmsContentModelType;
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
            [`get${typeName}`]: resolveManageGet({ model }),
            [`list${pluralizedTypeName(typeName)}`]: resolveList({ model })
        },
        Mutation: {
            [`create${typeName}`]: resolveCreate({ model }),
            [`update${typeName}`]: resolveUpdate({ model }),
            [`delete${typeName}`]: resolveDelete({ model }),
            [`publish${typeName}`]: resolvePublish({ model }),
            [`unpublish${typeName}`]: resolveUnpublish({ model }),
            [`create${typeName}From`]: resolveCreateFrom({ model })
        },
        [mTypeName]: model.fields.reduce(
            (resolvers, field) => {
                const { manage } = fieldTypePlugins[field.type];

                resolvers[field.fieldId] = manage.createResolver({ models, model, field });

                return resolvers;
            },
            {
                ...commonFieldResolvers(),
                meta(entry) {
                    return entry;
                }
            }
        ),
        [`${mTypeName}Meta`]: {
            title(entry) {
                if (model.titleFieldId) {
                    return entry.values[model.titleFieldId];
                }

                return "";
            },
            status(entry) {
                if (entry.published) {
                    return "published";
                }

                return entry.locked ? "locked" : "draft";
            },
            revisions(entry, args, context: CmsContext) {
                return context.cms.entries.listRevisions(entry.id);
            }
        }
    };
};
