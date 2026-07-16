import { Container } from "@webiny/feature/api";
import {
    GraphQLFeature,
    CmsModelFieldToGraphQLRegistry
} from "@webiny/api-headless-cms/features/graphql/index.js";
import { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldIndex/index.js";
import { CmsEntryOpenSearchFieldIndexFeature } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldIndex/feature.js";
import { CmsEntryOpenSearchValueSearchFeature } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchValueSearch/feature.js";
import { CmsEntryOpenSearchFilterFeature } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFilter/feature.js";
import { OpenSearchQueryBuilderOperatorFeature } from "@webiny/api-opensearch/features/OpenSearchQueryBuilderOperator/feature.js";

export const createTestContainer = () => {
    const container = new Container();
    GraphQLFeature.register(container);
    CmsEntryOpenSearchFieldIndexFeature.register(container);
    CmsEntryOpenSearchFilterFeature.register(container);
    CmsEntryOpenSearchValueSearchFeature.register(container);
    OpenSearchQueryBuilderOperatorFeature.register(container);
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
