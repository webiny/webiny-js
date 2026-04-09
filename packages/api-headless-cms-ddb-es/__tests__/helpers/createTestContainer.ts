import { Container } from "@webiny/di";
import {
    GraphQLFeature,
    CmsModelFieldToGraphQLRegistry
} from "@webiny/api-headless-cms/features/graphql/index.js";
import { CmsEntryOpenSearchFieldIndexRegistry } from "~/features/CmsEntryOpenSearchFieldIndex/index.js";
import { CmsEntryOpenSearchFieldIndexFeature } from "~/features/CmsEntryOpenSearchFieldIndex/feature.js";
import { CmsEntryOpenSearchValueSearchFeature } from "~/features/CmsEntryOpenSearchValueSearch/feature.js";

export const createTestContainer = () => {
    const container = new Container();
    GraphQLFeature.register(container);
    CmsEntryOpenSearchFieldIndexFeature.register(container);
    CmsEntryOpenSearchValueSearchFeature.register(container);
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
