import { CmsModel, CmsFieldTypePlugins, CmsContext } from "~/types";
import { resolveGet } from "./resolvers/preview/resolveGet";
import { resolveList } from "./resolvers/preview/resolveList";
import { createFieldResolversFactory } from "./createFieldResolvers";
import { createReadTypeName, createTypeName } from "~/utils/createTypeName";
import { pluralizedTypeName } from "~/utils/pluralizedTypeName";

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
    if (model.fields.length === 0) {
        return {
            Query: {}
        };
    }
    const typeName = createTypeName(model.modelId);
    const rTypeName = createReadTypeName(typeName);

    const createFieldResolvers = createFieldResolversFactory({
        endpointType: "read",
        models,
        model,
        fieldTypePlugins
    });

    const fieldResolvers = createFieldResolvers({
        graphQLType: rTypeName,
        fields: model.fields,
        isRoot: true
    });

    return {
        Query: {
            [`get${typeName}`]: resolveGet({ model }),
            [`list${pluralizedTypeName(typeName)}`]: resolveList({ model })
        },
        ...fieldResolvers
    };
};
