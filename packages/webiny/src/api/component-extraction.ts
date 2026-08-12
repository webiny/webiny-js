/**
 * The opt-in component-extraction surface a project needs to enable it.
 *
 * Kept separate on purpose: registering `ComponentExtractionFeature` pulls in the headless-browser
 * driver (Capture) and image tooling (Generate), and nothing that doesn't use extraction should pay
 * for that. A project imports this from here in an extension to turn the feature on — its GraphQL
 * schema, the nine stage tasks and the private CMS models all load with it.
 */
export { ComponentExtractionFeature } from "@webiny/api-component-extraction/feature.js";
