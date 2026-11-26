import type { ApiEndpoint, CmsContext, CmsEntry, CmsModel } from "~/types/index.js";
import { ListSingletonEntryRevisionsUseCase } from "~/features/contentEntry/ListSingletonEntryRevisions/index.js";
import { resolveGetLatest } from "./resolvers/singular/resolveGetLatest.js";
import { resolveGetPublished } from "./resolvers/singular/resolveGetPublished.js";
import { resolveGetRevision } from "./resolvers/singular/resolveGetRevision.js";
import { resolveGetRevisions } from "./resolvers/singular/resolveGetRevisions.js";
import { resolveUpdate } from "./resolvers/singular/resolveUpdate.js";
import { resolveUpdateRevisionDescription } from "./resolvers/singular/resolveUpdateRevisionDescription.js";
import { resolveCreateFrom } from "./resolvers/singular/resolveCreateFrom.js";
import { resolvePublish } from "./resolvers/singular/resolvePublish.js";
import { resolveUnpublish } from "./resolvers/singular/resolveUnpublish.js";
import { resolveDelete } from "./resolvers/singular/resolveDelete.js";
import { normalizeGraphQlInput } from "./resolvers/manage/normalizeGraphQlInput.js";
import { createFieldResolversFactory } from "./createFieldResolvers.js";
import { createEntryMetaResolvers } from "./createEntryMetaResolvers.js";
import type { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";

interface CreateSingularResolversParams {
    models: CmsModel[];
    model: CmsModel;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    type: ApiEndpoint;
}

interface CreateSingularResolvers {
    // TODO @ts-refactor determine correct type.
    (params: CreateSingularResolversParams): any;
}

export const createSingularResolvers: CreateSingularResolvers = ({
    models,
    model,
    fieldRegistry,
    type
}) => {
    if (model.fields.length === 0) {
        return {
            Query: {},
            Mutation: {}
        };
    }

    const resolverFactoryParams = { model, fieldRegistry };

    if (type !== "manage") {
        /**
         * Preview field resolvers render as "read", same as for regular models.
         */
        const createFieldResolvers = createFieldResolversFactory({
            endpointType: "read",
            models,
            model,
            fieldRegistry
        });

        const fieldResolvers = createFieldResolvers({
            graphQLType: model.singularApiName,
            fields: model.fields,
            isRoot: true
        });

        const resolveGet = type === "preview" ? resolveGetLatest : resolveGetPublished;

        return {
            Query: {
                [`get${model.singularApiName}`]: resolveGet(resolverFactoryParams)
            },
            ...fieldResolvers
        };
    }

    const createFieldResolvers = createFieldResolversFactory({
        endpointType: "manage",
        models,
        model,
        fieldRegistry
    });

    const fieldResolvers = createFieldResolvers({
        graphQLType: model.singularApiName,
        fields: model.fields,
        isRoot: true,
        extraResolvers: {
            meta(entry: CmsEntry) {
                return entry;
            }
        }
    });

    return {
        Query: {
            [`get${model.singularApiName}Latest`]: resolveGetLatest(resolverFactoryParams),
            [`get${model.singularApiName}Revision`]: resolveGetRevision(resolverFactoryParams),
            [`get${model.singularApiName}Revisions`]: resolveGetRevisions(resolverFactoryParams)
        },
        Mutation: {
            [`update${model.singularApiName}`]:
                normalizeGraphQlInput(resolveUpdate)(resolverFactoryParams),
            [`update${model.singularApiName}RevisionDescription`]:
                resolveUpdateRevisionDescription(resolverFactoryParams),
            [`create${model.singularApiName}From`]:
                normalizeGraphQlInput(resolveCreateFrom)(resolverFactoryParams),
            [`publish${model.singularApiName}`]: resolvePublish(resolverFactoryParams),
            [`unpublish${model.singularApiName}`]: resolveUnpublish(resolverFactoryParams),
            [`delete${model.singularApiName}`]: resolveDelete(resolverFactoryParams)
        },
        ...fieldResolvers,
        [`${model.singularApiName}Meta`]: createEntryMetaResolvers({
            model,
            async revisions(entry: Pick<CmsEntry, "entryId">, _: unknown, context: CmsContext) {
                const listRevisions = context.container.resolve(ListSingletonEntryRevisionsUseCase);
                const result = await listRevisions.execute(model, entry.entryId);
                if (result.isFail()) {
                    throw result.error;
                }
                return result.value.sort((a, b) => b.version - a.version);
            }
        })
    };
};
