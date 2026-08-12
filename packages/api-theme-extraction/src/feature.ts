import { createFeature } from "@webiny/feature/api";
import { ChromiumBrowserProvider } from "@webiny/site-capture/browser/ChromiumBrowserProvider.js";
import { createS3ScreenshotStore } from "@webiny/site-capture/storage/S3ScreenshotStore.js";
import { ScreenshotStore } from "~/features/shared/abstractions.js";
import {
    KeyValueArtifactCache,
    KeyValueExtractionLock
} from "~/storage/KeyValueExtractionStores.js";
import { CrawlSiteUseCase } from "~/features/crawl/CrawlSiteUseCase.js";
import { AnalyseCrawlUseCase } from "~/features/analyse/AnalyseCrawlUseCase.js";
import { ThemeExtractionTask } from "~/features/extract/ThemeExtractionTask.js";
import { registerThemeExtractionGraphQL } from "~/graphql/createGraphQL.js";

/**
 * Theme extraction.
 *
 * The browser and screenshot storage come from `@webiny/site-capture`; what stays here is everything
 * token-shaped — the sampler, the payload, the analysis. Note what is NOT registered: `ExtractionSettings`.
 * Extraction needs to know which model to use and over which connection, and that is deployment
 * configuration rather than something this package can decide. The project registers an implementation —
 * typically one that names a connection resolved by api-core's `AiConnectionFactory`, so extraction never
 * handles an API key and never has to know whether the credentials came from AI Power-Ups or elsewhere.
 *
 * With no implementation registered, the task fails at its first step with a message telling the user to
 * configure a model — which is the right failure, and much better than discovering it after a crawl.
 */
export const ThemeExtractionFeature = createFeature({
    name: "ThemeExtraction",
    register(container) {
        container.register(ChromiumBrowserProvider);
        // The screenshot store's only configuration is its S3 key prefix, which the container cannot
        // resolve as a dependency — so it is registered as a prefix-bound instance. Everything under
        // the `theme-extraction/` prefix is this feature's working data, cleaned up when a crawl finishes.
        container.registerInstance(ScreenshotStore, createS3ScreenshotStore("theme-extraction"));
        container.register(KeyValueArtifactCache);
        container.register(KeyValueExtractionLock);
        container.register(CrawlSiteUseCase);
        container.register(AnalyseCrawlUseCase);
        container.register(ThemeExtractionTask);
        registerThemeExtractionGraphQL(container);
    }
});
