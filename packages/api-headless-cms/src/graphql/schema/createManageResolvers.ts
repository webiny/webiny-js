import { CmsContext, CmsEntry, CmsFieldTypePlugins, CmsModel } from "~/types";
import { resolveGet } from "./resolvers/manage/resolveGet";
import { resolveList } from "./resolvers/manage/resolveList";
import { resolveListDeleted } from "./resolvers/manage/resolveListDeleted";
import { resolveGetRevisions } from "./resolvers/manage/resolveGetRevisions";
import { resolveGetByIds } from "./resolvers/manage/resolveGetByIds";
import { resolveCreate } from "./resolvers/manage/resolveCreate";
import { resolveUpdate } from "./resolvers/manage/resolveUpdate";
import { resolveValidate } from "./resolvers/manage/resolveValidate";
import { resolveMove } from "./resolvers/manage/resolveMove";
import { resolveDelete } from "./resolvers/manage/resolveDelete";
import { resolveRestoreFromBin } from "./resolvers/manage/resolveRestoreFromBin";
import { resolveDeleteMultiple } from "./resolvers/manage/resolveDeleteMultiple";
import { resolvePublish } from "./resolvers/manage/resolvePublish";
import { resolveRepublish } from "./resolvers/manage/resolveRepublish";
import { resolveUnpublish } from "./resolvers/manage/resolveUnpublish";
import { resolveCreateFrom } from "./resolvers/manage/resolveCreateFrom";
import { normalizeGraphQlInput } from "./resolvers/manage/normalizeGraphQlInput";
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
            /**
             * Advanced Content Organization
             */
            wbyAco_location: async (entry: CmsEntry) => {
                return entry.location || null;
            },
            meta(entry) {
                return entry;
            }
        }
    });

    const resolverFactoryParams = { model, fieldTypePlugins };

    return {
        Query: {
            [`get${model.singularApiName}`]: resolveGet(resolverFactoryParams),
            [`get${model.singularApiName}Revisions`]: resolveGetRevisions(resolverFactoryParams),
            [`get${model.pluralApiName}ByIds`]: resolveGetByIds(resolverFactoryParams),
            [`list${model.pluralApiName}`]: resolveList(resolverFactoryParams),
            [`listDeleted${model.pluralApiName}`]: resolveListDeleted(resolverFactoryParams)
        },
        Mutation: {
            [`create${model.singularApiName}`]:
                normalizeGraphQlInput(resolveCreate)(resolverFactoryParams),
            [`update${model.singularApiName}`]:
                normalizeGraphQlInput(resolveUpdate)(resolverFactoryParams),
            [`validate${model.singularApiName}`]: resolveValidate(resolverFactoryParams),
            [`move${model.singularApiName}`]: resolveMove(resolverFactoryParams),
            [`delete${model.singularApiName}`]: resolveDelete(resolverFactoryParams),
            [`restore${model.singularApiName}FromBin`]:
                resolveRestoreFromBin(resolverFactoryParams),
            [`deleteMultiple${model.pluralApiName}`]: resolveDeleteMultiple(resolverFactoryParams),
            [`publish${model.singularApiName}`]: resolvePublish(resolverFactoryParams),
            [`republish${model.singularApiName}`]: resolveRepublish(resolverFactoryParams),
            [`unpublish${model.singularApiName}`]: resolveUnpublish(resolverFactoryParams),
            [`create${model.singularApiName}From`]:
                normalizeGraphQlInput(resolveCreateFrom)(resolverFactoryParams)
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
