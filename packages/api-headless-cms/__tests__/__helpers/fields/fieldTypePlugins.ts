import { Context } from "@webiny/api";
import { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";
import { GraphQLFeature } from "~/features/graphql/feature.js";

export const createFieldTypePlugins = () => {
    const context = new Context({
        plugins: [],
        WEBINY_VERSION: "0.0.0"
    });
    GraphQLFeature.register(context.container);

    return context.container.resolve(CmsModelFieldToGraphQLRegistry).getAllAsPlugins();
};
