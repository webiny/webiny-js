import { CmsContentModel, CmsFieldTypePlugins, CmsContext } from "~/types";
import { resolveGet } from "./resolvers/preview/resolveGet";
import { resolveList } from "./resolvers/preview/resolveList";
import { createFieldResolversFactory } from "~/content/plugins/schema/createFieldResolvers";
import { createReadTypeName, createTypeName } from "~/content/plugins/utils/createTypeName";
import { pluralizedTypeName } from "~/content/plugins/utils/pluralizedTypeName";

export interface CreateReadResolvers {
    (params: {
        models: CmsContentModel[];
        model: CmsContentModel;
        context: CmsContext;
        fieldTypePlugins: CmsFieldTypePlugins;
    }): any;
}

export const createPreviewResolvers: CreateReadResolvers = ({
    models,
    model,
    fieldTypePlugins
}) => {
    const typeName = createTypeName(model.modelId);
    const rTypeName = createReadTypeName(typeName);

    const createFieldResolvers = createFieldResolversFactory({
        endpointType: "read",
        models,
        model,
        fieldTypePlugins
    });

    return {
        Query: {
            [`get${typeName}`]: resolveGet({ model }),
            [`list${pluralizedTypeName(typeName)}`]: resolveList({ model })
        },
        ...createFieldResolvers({
            graphQLType: rTypeName,
            fields: model.fields,
            isRoot: true
        })
    };
};
