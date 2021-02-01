import {
    CmsContentModel,
    CmsFieldTypePlugins,
    CmsContext,
    CmsContentEntry
} from "@webiny/api-headless-cms/types";
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

interface CreateManageResolvers {
    (params: {
        models: CmsContentModel[];
        model: CmsContentModel;
        context: CmsContext;
        fieldTypePlugins: CmsFieldTypePlugins;
    }): any;
}

const getModelTitle = (model: CmsContentModel, entry: CmsContentEntry): string => {
    if (!model.titleFieldId) {
        return entry.id;
    }
    const titleValue = entry.values[model.titleFieldId];
    if (!titleValue) {
        return entry.id;
    }
    const field = model.fields.find(f => f.fieldId === model.titleFieldId);
    if (!field) {
        return titleValue;
    }
    const { enabled = false, values = [] } = field.predefinedValues;
    if (!enabled || Array.isArray(values) === false) {
        return titleValue;
    }
    for (const value of values) {
        if (value.value === titleValue) {
            return value.label;
        }
    }
    return titleValue;
};

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
                const { manage } = fieldTypePlugins[field.type];

                const resolver = manage.createResolver
                    ? manage.createResolver({ models, model, field })
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
                return getModelTitle(model, entry);
            },
            status(entry) {
                return entry.status;
            },
            async revisions(entry, args, context: CmsContext) {
                const entryId = entry.id.split("#")[0];
                const revisions = await context.cms.entries.getEntryRevisions(entryId);
                return revisions.sort((a, b) => b.version - a.version);
            }
        }
    };
};
