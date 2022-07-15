import { CmsModel, CmsFieldTypePlugins, CmsContext, CmsEntry } from "~/types";
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
import { resolveRepublish } from "./resolvers/manage/resolveRepublish";
import { resolveUnpublish } from "./resolvers/manage/resolveUnpublish";
import { resolveCreateFrom } from "./resolvers/manage/resolveCreateFrom";
import { createFieldResolversFactory } from "./createFieldResolvers";
import { createManageTypeName, createTypeName } from "~/utils/createTypeName";
import { pluralizedTypeName } from "~/utils/pluralizedTypeName";
import { getEntryTitle } from "~/utils/getEntryTitle";

interface CreateManageResolversParams {
    models: CmsModel[];
    model: CmsModel;
    context: CmsContext;
    fieldTypePlugins: CmsFieldTypePlugins;
}
interface CreateManageResolvers {
    // TODO @ts-refactor determine correct type.
    (params: CreateManageResolversParams): any;
}

export const createManageResolvers: CreateManageResolvers = ({
    models,
    model,
    fieldTypePlugins
}) => {
    if (model.fields.length === 0) {
        return {
            Query: {},
            Mutation: {}
        };
    }
    const typeName = createTypeName(model.modelId);
    const mTypeName = createManageTypeName(typeName);
    const createFieldResolvers = createFieldResolversFactory({
        endpointType: "manage",
        models,
        model,
        fieldTypePlugins
    });

    const fieldResolvers = createFieldResolvers({
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
            [`republish${typeName}`]: resolveRepublish({ model }),
            [`unpublish${typeName}`]: resolveUnpublish({ model }),
            [`create${typeName}From`]: resolveCreateFrom({ model }),
            [`request${typeName}Review`]: resolveRequestReview({ model }),
            [`request${typeName}Changes`]: resolveRequestChanges({ model })
        },
        ...fieldResolvers,
        [`${mTypeName}Meta`]: {
            title(entry: CmsEntry) {
                return getEntryTitle(model, entry);
            },
            status(entry: CmsEntry) {
                return entry.status;
            },
            data: (entry: CmsEntry) => {
                return entry.meta || {};
            },
            async revisions(entry: CmsEntry, _: any, context: CmsContext) {
                const revisions = await context.cms.getEntryRevisions(model, entry.entryId);
                return revisions.sort((a, b) => b.version - a.version);
            }
        }
    };
};
