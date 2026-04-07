import type { CmsModel } from "~/types/index.js";
import { resolveGet } from "./resolvers/preview/resolveGet.js";
import { resolveList } from "./resolvers/preview/resolveList.js";
import { createFieldResolversFactory } from "./createFieldResolvers.js";
import type { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";

interface CreateReadResolversParams {
    models: CmsModel[];
    model: CmsModel;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
}

export interface CreateReadResolvers {
    // TODO @ts-refactor determine correct type.
    (params: CreateReadResolversParams): any;
}

export const createPreviewResolvers: CreateReadResolvers = ({ models, model, fieldRegistry }) => {
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

    return {
        Query: {
            [`get${model.singularApiName}`]: resolveGet({ model, fieldRegistry }),
            [`list${model.pluralApiName}`]: resolveList({ model, fieldRegistry })
        },
        ...fieldResolvers
    };
};
