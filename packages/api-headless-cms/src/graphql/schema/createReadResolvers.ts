import type { CmsFieldTypePlugins, CmsModel } from "~/types/index.js";
import { resolveGet } from "./resolvers/read/resolveGet.js";
import { resolveList } from "./resolvers/read/resolveList.js";
import { createFieldResolversFactory } from "./createFieldResolvers.js";

interface CreateReadResolversParams {
    models: CmsModel[];
    model: CmsModel;
    fieldTypePlugins: CmsFieldTypePlugins;
}

export interface CreateReadResolvers {
    // TODO @ts-refactor determine correct type.
    (params: CreateReadResolversParams): any;
}

export const createReadResolvers: CreateReadResolvers = ({ models, model, fieldTypePlugins }) => {
    const createFieldResolvers = createFieldResolversFactory({
        endpointType: "read",
        models,
        model,
        fieldTypePlugins
    });

    const fieldResolvers = createFieldResolvers({
        graphQLType: model.singularApiName,
        fields: model.fields,
        isRoot: true
    });
    
    const key = model.singularApiName as keyof typeof fieldResolvers;
    // @ts-expect-error
    if (!fieldResolvers[key].modelId) {
        // @ts-expect-error
        fieldResolvers[key].modelId = () => {
            return model.modelId;
        };
    }

    return {
        Query: {
            [`get${model.singularApiName}`]: resolveGet({ model, fieldTypePlugins }),
            [`list${model.pluralApiName}`]: resolveList({ model, fieldTypePlugins })
        },
        ...fieldResolvers
    };
};
