import type { ApiEndpoint, CmsModel } from "~/types/index.js";
import { resolveGet } from "./resolvers/singular/resolveGet.js";
import { resolveUpdate } from "./resolvers/singular/resolveUpdate.js";
import { normalizeGraphQlInput } from "./resolvers/manage/normalizeGraphQlInput.js";
import { createFieldResolversFactory } from "./createFieldResolvers.js";
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

    const createFieldResolvers = createFieldResolversFactory({
        endpointType: type,
        models,
        model,
        fieldRegistry
    });

    const fieldResolvers = createFieldResolvers({
        graphQLType: model.singularApiName,
        fields: model.fields,
        isRoot: true
    });

    const resolverFactoryParams = { model, fieldRegistry };

    const result = {
        Query: {
            [`get${model.singularApiName}`]: resolveGet(resolverFactoryParams)
        },
        ...fieldResolvers
    };
    if (type !== "manage") {
        return result;
    }
    return {
        ...result,
        Mutation: {
            [`update${model.singularApiName}`]:
                normalizeGraphQlInput(resolveUpdate)(resolverFactoryParams)
        }
    };
};
