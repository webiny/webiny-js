import { CmsModel, CmsFieldTypePlugins, CmsContext } from "~/types";
import { resolveGet } from "./resolvers/preview/resolveGet";
import { resolveList } from "./resolvers/preview/resolveList";
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

export const createPreviewResolvers: CreateReadResolvers = ({
    models,
    model,
    fieldTypePlugins
}) => {
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
        ...fieldResolvers
    };
};
