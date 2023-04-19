import { CmsFieldTypePlugins, CmsContext, CmsEntry, CmsModel } from "~/types";
import { commonFieldResolvers } from "./resolvers/commonFieldResolvers";
import { resolveGet } from "./resolvers/manage/resolveGet";
import { resolveList } from "./resolvers/manage/resolveList";
import { resolveGetRevisions } from "./resolvers/manage/resolveGetRevisions";
import { resolveGetByIds } from "./resolvers/manage/resolveGetByIds";
import { resolveCreate } from "./resolvers/manage/resolveCreate";
import { resolveUpdate } from "./resolvers/manage/resolveUpdate";
import { resolveDelete } from "./resolvers/manage/resolveDelete";
// import { resolveListFieldUniqueValues } from "./resolvers/manage/resolveFieldUniqueValues";
import { resolvePublish } from "./resolvers/manage/resolvePublish";
import { resolveRepublish } from "./resolvers/manage/resolveRepublish";
import { resolveUnpublish } from "./resolvers/manage/resolveUnpublish";
import { resolveCreateFrom } from "./resolvers/manage/resolveCreateFrom";
import { createFieldResolversFactory } from "./createFieldResolvers";
import { getEntryTitle } from "~/utils/getEntryTitle";
import { getEntryImage } from "~/utils/getEntryImage";
import { entryFieldFromStorageTransform } from "~/utils/entryStorage";

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

    const createFieldResolvers = createFieldResolversFactory({
        endpointType: "manage",
        models,
        model,
        fieldTypePlugins
    });

    const fieldResolvers = createFieldResolvers({
        graphQLType: model.singularApiName,
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
            [`get${model.singularApiName}`]: resolveGet({ model }),
            [`get${model.singularApiName}Revisions`]: resolveGetRevisions({ model }),
            [`get${model.pluralApiName}ByIds`]: resolveGetByIds({ model }),
            [`list${model.pluralApiName}`]: resolveList({ model })
            // [`list${model.singularApiName}FieldUniqueValues`]: resolveListFieldUniqueValues({
            //     model
            // })
        },
        Mutation: {
            [`create${model.singularApiName}`]: resolveCreate({ model }),
            [`update${model.singularApiName}`]: resolveUpdate({ model }),
            [`delete${model.singularApiName}`]: resolveDelete({ model }),
            [`publish${model.singularApiName}`]: resolvePublish({ model }),
            [`republish${model.singularApiName}`]: resolveRepublish({ model }),
            [`unpublish${model.singularApiName}`]: resolveUnpublish({ model }),
            [`create${model.singularApiName}From`]: resolveCreateFrom({ model })
        },
        ...fieldResolvers,
        [`${model.singularApiName}Meta`]: {
            title(entry: CmsEntry) {
                return getEntryTitle(model, entry);
            },
            description: (entry: CmsEntry, _: any, context: CmsContext) => {
                if (!model.descriptionFieldId) {
                    return "";
                }
                const field = model.fields.find(f => f.fieldId === model.descriptionFieldId);
                if (!field) {
                    return "";
                }

                return entryFieldFromStorageTransform({
                    context,
                    model,
                    field,
                    value: entry.values[field.fieldId]
                });
            },
            image: (entry: CmsEntry) => {
                return getEntryImage(model, entry);
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
