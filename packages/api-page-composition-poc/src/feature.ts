import { type Container, createFeature } from "@webiny/feature/api";
import { ComposePagesService } from "~/features/ComposePagesService.js";
import { CompositionReader } from "~/features/composition/CompositionReader.js";
import { CompositionWriter } from "~/features/composition/CompositionWriter.js";
import { ComposePagesTask } from "~/features/ComposePagesTask.js";
import { BuildSiteTask } from "~/features/site/BuildSiteTask.js";
import { SiteStoreImplementation } from "~/storage/SiteStore.js";
import { PageMapStore } from "~/storage/PageMapStore.js";
import { ComposedCaptureStore } from "~/storage/ComposedCaptureStore.js";
import { registerPageCompositionGraphQL } from "~/graphql/createGraphQL.js";
import { AssetUrlResolverImplementation } from "~/features/AssetUrlResolver.js";
import { ComposedImageRouteDefinition } from "~/rest/ComposedImageRoute.js";

/**
 * Page composition — THROWAWAY PROOF OF CONCEPT. See the package README before touching anything here.
 *
 * Registered alongside component extraction (it consumes a run's artifacts and nothing else depends
 * on it), and deliberately opt-in: it is an extension a project registers, never part of core.
 */
export const PageCompositionPocFeature = createFeature({
    name: "PageCompositionPoc",
    register(container: Container) {
        container.register(AssetUrlResolverImplementation);
        container.register(PageMapStore);
        container.register(ComposedCaptureStore);
        container.register(CompositionReader);
        container.register(CompositionWriter);
        container.register(ComposePagesService);
        container.register(SiteStoreImplementation);
        container.register(BuildSiteTask);
        container.register(ComposePagesTask);

        registerPageCompositionGraphQL(container);

        // The auth-gated composed-screenshot route, serving the half of the comparison a local
        // harness uploaded.
        container.register(ComposedImageRouteDefinition);
    }
});
