import { ApiEndpoint, CmsContext, CmsFieldTypePlugins, CmsModel } from "~/types";
import { resolveGet } from "./resolvers/singular/resolveGet";
import { resolveUpdate } from "./resolvers/singular/resolveUpdate";
import { normalizeGraphQlInput } from "./resolvers/manage/normalizeGraphQlInput";
import { createFieldResolversFactory } from "./createFieldResolvers";

interface CreateSingularResolversParams {
    models: CmsModel[];
    model: CmsModel;
    context: CmsContext;
    fieldTypePlugins: CmsFieldTypePlugins;
    type: ApiEndpoint;
}

interface CreateSingularResolvers {
    // TODO @ts-refactor determine correct type.
    (params: CreateSingularResolversParams): any;
}

export const createSingularResolvers: CreateSingularResolvers = ({
    models,
    model,
    fieldTypePlugins,
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
        fieldTypePlugins
    });

    const fieldResolvers = createFieldResolvers({
        graphQLType: model.singularApiName,
        fields: model.fields,
        isRoot: true
    });

    const resolverFactoryParams = { model, fieldTypePlugins };

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
