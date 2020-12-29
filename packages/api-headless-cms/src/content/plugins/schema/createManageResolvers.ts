import {
    CmsContentModelType,
    CmsFieldTypePlugins,
    CmsContext
} from "@webiny/api-headless-cms/types";
import { createManageTypeName, createTypeName } from "../utils/createTypeName";
import { commonFieldResolvers } from "../utils/commonFieldResolvers";
import { resolveManageGet } from "../utils/resolvers/resolveManageGet";
import { resolveList } from "../utils/resolvers/resolveList";
import { resolveGetRevisions } from "../utils/resolvers/resolveGetRevisions";
import { resolveGetByIds } from "../utils/resolvers/resolveGetByIds";
import { resolveCreate } from "../utils/resolvers/resolveCreate";
import { resolveUpdate } from "../utils/resolvers/resolveUpdate";
import { resolveDelete } from "../utils/resolvers/resolveDelete";
import { resolvePublish } from "../utils/resolvers/resolvePublish";
import { resolveUnpublish } from "../utils/resolvers/resolveUnpublish";
import { resolveCreateFrom } from "../utils/resolvers/resolveCreateFrom";
import { pluralizedTypeName } from "../utils/pluralizedTypeName";

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
