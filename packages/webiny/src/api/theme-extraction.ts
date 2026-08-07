/**
 * The opt-in theme-extraction surface a project needs to enable it.
 *
 * Kept separate from `webiny/api/theme` on purpose: registering `ThemeExtractionFeature` pulls in the
 * headless-browser driver, and nothing that only touches the core theme API should pay for that. A
 * project imports these from here in an extension to turn extraction on and point it at an AI provider.
 */
export { ThemeExtractionFeature } from "@webiny/api-theme-extraction/feature.js";
export { ExtractionSettings, ExtractionNotConfiguredError } from "@webiny/api-theme-extraction";
