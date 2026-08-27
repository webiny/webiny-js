import { Container } from "@webiny/feature/api";
import {
    GraphQLFeature,
    CmsModelFieldToGraphQLRegistry
} from "@webiny/api-headless-cms/features/graphql/index.js";
import { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldIndex/index.js";
import { CmsEntryOpenSearchUtilsFeature } from "@webiny/api-headless-cms-utils-os";
import { OpenSearchQueryBuilderOperatorFeature } from "@webiny/api-opensearch/features/OpenSearchQueryBuilderOperator/feature.js";

export const createTestContainer = () => {
    const container = new Container();
    GraphQLFeature.register(container);
    OpenSearchQueryBuilderOperatorFeature.register(container);
    CmsEntryOpenSearchUtilsFeature.register(container);
    return container;
};

export const createFieldRegistry = (): CmsModelFieldToGraphQLRegistry.Interface => {
    const container = createTestContainer();
    return container.resolve(CmsModelFieldToGraphQLRegistry);
};

export const createFieldIndexRegistry = (): CmsEntryOpenSearchFieldIndexRegistry.Interface => {
    const container = createTestContainer();
    return container.resolve(CmsEntryOpenSearchFieldIndexRegistry);
};
