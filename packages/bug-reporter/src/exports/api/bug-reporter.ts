/*
 * The drafter is the only thing an extension decorates: it turns the raw report into an issue
 * title, summary and steps. See `extensions/bugReportAi` for the AI implementation.
 */
export { IssueDrafter } from "~/api/drafter/abstractions.js";

// Plain wire types with no abstraction behind them, so they have no namespace to live in.
export type { IBugReportPayload } from "~/shared/types.js";
export type { IReportedScreenshot } from "~/shared/types.js";
