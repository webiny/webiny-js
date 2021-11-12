import { CmsContentModel, CmsFieldTypePlugins, CmsContext } from "~/types";
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
import { createFieldResolversFactory } from "~/content/plugins/schema/createFieldResolvers";
import { createManageTypeName, createTypeName } from "~/content/plugins/utils/createTypeName";
import { pluralizedTypeName } from "~/content/plugins/utils/pluralizedTypeName";
import { getEntryTitle } from "~/content/plugins/utils/getEntryTitle";

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
    const createFieldResolvers = createFieldResolversFactory({
        endpointType: "manage",
        models,
        model,
        fieldTypePlugins
    });

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
        ...createFieldResolvers({
            graphQLType: mTypeName,
            fields: model.fields,
            isRoot: true,
            // These are extra fields we want to apply to field resolvers of "gqlType"
            extraResolvers: {
                ...commonFieldResolvers(),
                meta(entry) {
                    return entry;
                }
            }
        }),
        [`${mTypeName}Meta`]: {
            title(entry) {
                return getEntryTitle(model, entry);
            },
            status(entry) {
                return entry.status;
            },
            async revisions(entry, _, context: CmsContext) {
                const entryId = entry.id.split("#")[0];
                const revisions = await context.cms.getEntryRevisions(model, entryId);
                return revisions.sort((a, b) => b.version - a.version);
            }
        }
    };
};
