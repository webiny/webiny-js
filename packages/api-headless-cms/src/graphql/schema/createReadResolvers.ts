import { CmsModel, CmsFieldTypePlugins, CmsContext } from "~/types";
import { resolveGet } from "./resolvers/read/resolveGet";
import { resolveList } from "./resolvers/read/resolveList";
import { createFieldResolversFactory } from "./createFieldResolvers";

interface CreateReadResolversParams {
    models: CmsModel[];
    model: CmsModel;
    context: CmsContext;
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

    return {
        Query: {
            [`get${model.singularApiName}`]: resolveGet({ model, fieldTypePlugins }),
            [`list${model.pluralApiName}`]: resolveList({ model, fieldTypePlugins })
        },
        [model.singularApiName]: {
            modelId: () => {
                return model.modelId;
            }
        },
        ...fieldResolvers
    };
};
