import { CmsModel, CmsFieldTypePlugins, CmsContext } from "~/types";
import { resolveGet } from "./resolvers/read/resolveGet";
import { resolveList } from "./resolvers/read/resolveList";
import { createFieldResolversFactory } from "~/content/plugins/schema/createFieldResolvers";
import { createReadTypeName, createTypeName } from "~/content/plugins/utils/createTypeName";
import { pluralizedTypeName } from "~/content/plugins/utils/pluralizedTypeName";

export interface CreateReadResolvers {
    (params: {
        models: CmsModel[];
        model: CmsModel;
        context: CmsContext;
        fieldTypePlugins: CmsFieldTypePlugins;
    }): any;
}

export const createReadResolvers: CreateReadResolvers = ({ models, model, fieldTypePlugins }) => {
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
