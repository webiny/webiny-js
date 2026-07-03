import { Container } from "@webiny/feature/api";
import {
    GraphQLFeature,
    CmsModelFieldToGraphQLRegistry
} from "@webiny/api-headless-cms/features/graphql/index.js";

export const createFieldRegistry = (): CmsModelFieldToGraphQLRegistry.Interface => {
    const container = new Container();
    GraphQLFeature.register(container);
    return container.resolve(CmsModelFieldToGraphQLRegistry);
};
