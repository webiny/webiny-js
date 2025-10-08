import type { CmsContext, CmsEntry, CmsFieldTypePlugins, CmsModel } from "~/types/index.js";
import { resolveGet } from "./resolvers/manage/resolveGet.js";
import { resolveList } from "./resolvers/manage/resolveList.js";
import { resolveListDeleted } from "./resolvers/manage/resolveListDeleted.js";
import { resolveGetRevisions } from "./resolvers/manage/resolveGetRevisions.js";
import { resolveGetByIds } from "./resolvers/manage/resolveGetByIds.js";
import { resolveCreate } from "./resolvers/manage/resolveCreate.js";
import { resolveUpdate } from "./resolvers/manage/resolveUpdate.js";
import { resolveValidate } from "./resolvers/manage/resolveValidate.js";
import { resolveMove } from "./resolvers/manage/resolveMove.js";
import { resolveDelete } from "./resolvers/manage/resolveDelete.js";
import { resolveRestoreFromBin } from "./resolvers/manage/resolveRestoreFromBin.js";
import { resolveDeleteMultiple } from "./resolvers/manage/resolveDeleteMultiple.js";
import { resolvePublish } from "./resolvers/manage/resolvePublish.js";
import { resolveRepublish } from "./resolvers/manage/resolveRepublish.js";
import { resolveUnpublish } from "./resolvers/manage/resolveUnpublish.js";
import { resolveCreateFrom } from "./resolvers/manage/resolveCreateFrom.js";
import { normalizeGraphQlInput } from "./resolvers/manage/normalizeGraphQlInput.js";
import { createFieldResolversFactory } from "./createFieldResolvers.js";
import { getEntryTitle } from "~/utils/getEntryTitle.js";
import { getEntryImage } from "~/utils/getEntryImage.js";
import { entryFieldFromStorageTransform } from "~/utils/entryStorage.js";

interface CreateManageResolversParams {
    models: CmsModel[];
    model: CmsModel;
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
            title(entry: Pick<CmsEntry, "id" | "values">) {
                return getEntryTitle(model, entry);
            },
            description: (entry: Pick<CmsEntry, "values">, _: any, context: CmsContext) => {
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
            image: (entry: Pick<CmsEntry, "values">) => {
                return getEntryImage(model, entry);
            },
            status(entry: Pick<CmsEntry, "status">) {
                return entry.status;
            },
            data: (entry: Pick<CmsEntry, "meta">) => {
                return entry.meta || {};
            },
            async revisions(entry: Pick<CmsEntry, "entryId">, _: any, context: CmsContext) {
                const revisions = await context.cms.getEntryRevisions(model, entry.entryId);
                return revisions.sort((a, b) => b.version - a.version);
            }
        }
    };
};
