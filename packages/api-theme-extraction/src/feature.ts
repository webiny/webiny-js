import { createFeature } from "@webiny/feature/api";
import { ChromiumBrowserProvider } from "~/browser/ChromiumBrowserProvider.js";
import { S3ScreenshotStore } from "~/storage/S3ScreenshotStore.js";
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
 * Note what is NOT registered here: `ExtractionSettings`. Extraction needs to know which model to use
 * and over which connection, and that is deployment configuration rather than something this package
 * can decide. The project registers an implementation — typically one that names a connection resolved
 * by api-core's `AiConnectionFactory`, so extraction never handles an API key and never has to know
 * whether the credentials came from AI Power-Ups or from somewhere else.
 *
 * With no implementation registered, the task fails at its first step with a message telling the user to
 * configure a model — which is the right failure, and much better than discovering it after a crawl.
 */
export const ThemeExtractionFeature = createFeature({
    name: "ThemeExtraction",
    register(container) {
        container.register(ChromiumBrowserProvider);
        container.register(S3ScreenshotStore);
        container.register(KeyValueArtifactCache);
        container.register(KeyValueExtractionLock);
        container.register(CrawlSiteUseCase);
        container.register(AnalyseCrawlUseCase);
        container.register(ThemeExtractionTask);
        registerThemeExtractionGraphQL(container);
    }
});
