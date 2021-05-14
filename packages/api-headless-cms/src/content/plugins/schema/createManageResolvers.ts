import { CmsContentModel, CmsFieldTypePlugins, CmsContext } from "../../../types";
import get from "lodash/get";
import { commonFieldResolvers } from "./resolvers/commonFieldResolvers";
import { resolveGet } from "./resolvers/manage/resolveGet";
import { resolveList } from "./resolvers/manage/resolveList";
import { resolveGetRevisions } from "./resolvers/manage/resolveGetRevisions";
import { resolveGetByIds } from "./resolvers/manage/resolveGetByIds";
import { resolveCreate } from "./resolvers/manage/resolveCreate";
import { resolveUpdate } from "./resolvers/manage/resolveUpdate";
import { resolveRequestReview } from "./resolvers/manage/resolveRequestReview";
import { resolveRequestChanges } from "./resolvers/manage/resolveRequestChanges";
import { resolveDelete } from "./resolvers/manage/resolveDelete";
import { resolvePublish } from "./resolvers/manage/resolvePublish";
import { resolveUnpublish } from "./resolvers/manage/resolveUnpublish";
import { resolveCreateFrom } from "./resolvers/manage/resolveCreateFrom";
import { createManageTypeName, createTypeName } from "../utils/createTypeName";
import { pluralizedTypeName } from "../utils/pluralizedTypeName";
import { entryFieldFromStorageTransform } from "../utils/entryStorage";
import { getEntryTitle } from "../utils/getEntryTitle";

interface CreateManageResolvers {
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
            [`get${typeName}Revisions`]: resolveGetRevisions({ model }),
            [`get${pluralizedTypeName(typeName)}ByIds`]: resolveGetByIds({ model }),
            [`list${pluralizedTypeName(typeName)}`]: resolveList({ model })
        },
        Mutation: {
            [`create${typeName}`]: resolveCreate({ model }),
            [`update${typeName}`]: resolveUpdate({ model }),
            [`delete${typeName}`]: resolveDelete({ model }),
            [`publish${typeName}`]: resolvePublish({ model }),
            [`unpublish${typeName}`]: resolveUnpublish({ model }),
            [`create${typeName}From`]: resolveCreateFrom({ model }),
            [`request${typeName}Review`]: resolveRequestReview({ model }),
            [`request${typeName}Changes`]: resolveRequestChanges({ model })
        },
        [mTypeName]: model.fields.reduce(
            (resolvers, field) => {
                /**
                 * Every time a client updates content model's fields, we check the type of each field. If a field plugin
                 * for a particular "field.type" doesn't exist on the backend yet, we just skip creating the resolver.
                 * It is still possible to have a content model that contains a field, for which we don't have a plugin
                 * registered on the backend. For example, user could've just removed the plugin from the backend.
                 */
                if (!fieldTypePlugins[field.type]) {
                    return resolvers;
                }
                const createResolver = get(fieldTypePlugins, `${field.type}.manage.createResolver`);
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
                return getEntryTitle(model, entry);
            },
            status(entry) {
                return entry.status;
            },
            async revisions(entry, args, context: CmsContext) {
                const entryId = entry.id.split("#")[0];
                const revisions = await context.cms.entries.getEntryRevisions(model, entryId);
                return revisions.sort((a, b) => b.version - a.version);
            }
        }
    };
};
