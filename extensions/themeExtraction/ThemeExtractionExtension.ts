import { createFeature, Result } from "webiny/api";
import { AiCapability, ResolveAiCapabilityUseCase } from "webiny/api/ai-powerups";
import {
    ExtractionSettings,
    ExtractionNotConfiguredError,
    ThemeExtractionFeature
} from "webiny/api/theme-extraction";

export const THEME_EXTRACTION_CAPABILITY = "theme.extraction";

/**
 * Theme extraction as an AI capability, so it appears in Settings → AI Power-Ups and can be pointed
 * at a different model than the rest of the admin.
 *
 * `vision` because extraction sends page screenshots as image parts (`AnalyseCrawlUseCase`); a
 * text-only model either errors or invents a palette from the HTML alone. An unfilled `vision` role
 * falls back to `standard`, which is the resolver's behaviour and is stated next to the role in
 * settings.
 *
 * No `guidance`: the extraction prompt is assembled per run from the crawl (observed colours,
 * lengths, screenshot plan) and carries the flat-map output contract the parser depends on, so it
 * stays in code.
 */
class ThemeExtractionCapability implements AiCapability.Interface {
    readonly id = THEME_EXTRACTION_CAPABILITY;
    readonly label = "Theme extraction";
    readonly description =
        "Reads a website and proposes a theme from its design. Needs a model that accepts image input.";
    readonly defaultRole = "vision" as const;
}

const ThemeExtractionCapabilityImpl = AiCapability.createImplementation({
    implementation: ThemeExtractionCapability,
    dependencies: []
});

/**
 * Enables theme extraction (generate a theme from a website) on this project.
 *
 * The extraction backend — `@webiny/api-theme-extraction` — ships everything (crawler, AI analysis,
 * background task, GraphQL schema) except one decision the framework cannot make: *which* AI model to
 * use, and over which connection. This extension does two things:
 *
 *   1. Registers `ThemeExtractionFeature`, so its schema and task actually load. Without this, the
 *      Admin's "generate from a website" call fails with `Unknown type "ThemeExtractionInput"`.
 *   2. Fills the open `ExtractionSettings` seam by resolving the capability above through AI
 *      Power-Ups, so there is one place to set up AI and one place to re-point this feature.
 *
 * The API key never lands here as a stored value: the resolver reads the connection, checks the model
 * against that connection's vendor, and decrypts the key at call time. Extraction only ever receives
 * `{ model, connection }`.
 */
class AiPowerUpsExtractionSettings implements ExtractionSettings.Interface {
    constructor(private resolveCapability?: ResolveAiCapabilityUseCase.Interface) {}

    async getModel() {
        // AI Power-Ups registers nothing when the feature is off, so the resolver can be absent.
        if (!this.resolveCapability) {
            return Result.fail(
                new ExtractionNotConfiguredError("AI Power-Ups is not enabled on this project")
            );
        }

        const resolved = await this.resolveCapability.execute(THEME_EXTRACTION_CAPABILITY);
        if (resolved.isFail()) {
            // The resolver's message already names the settings screen and what to pick there, so it
            // is forwarded rather than replaced with something vaguer.
            return Result.fail(new ExtractionNotConfiguredError(detail(resolved.error.message)));
        }

        return Result.ok({
            model: resolved.value.model,
            connection: resolved.value.connection
        });
    }
}

/** Fits a resolver message into "Theme extraction is not configured: …" without doubling up. */
const detail = (message: string): string => {
    const trimmed = message.trim().replace(/\.$/, "");
    return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
};

const AiPowerUpsExtractionSettingsImpl = ExtractionSettings.createImplementation({
    implementation: AiPowerUpsExtractionSettings,
    dependencies: [[ResolveAiCapabilityUseCase, { optional: true }]]
});

export default createFeature({
    name: "MyApp/ThemeExtraction",
    register(container) {
        // The built-but-unregistered extraction backend: crawler, analysis, task, GraphQL schema.
        ThemeExtractionFeature.register(container);
        // Its model choice, and the settings row that makes it configurable.
        container.register(ThemeExtractionCapabilityImpl);
        container.register(AiPowerUpsExtractionSettingsImpl);
    }
});
