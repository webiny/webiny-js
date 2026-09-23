import { createFeature } from "webiny/api";
import { BugReportDraftCapability } from "./capability.js";
import { BugReportDrafterDecorator } from "./BugReportDrafterDecorator.js";

/**
 * AI drafting for the bug reporter.
 *
 * Internal to this repo, and deliberately NOT part of @webiny/bug-reporter: the base package files
 * the reporter's own words and knows nothing about AI, so it carries no `ai`, `zod` or
 * ai-powerups dependency. This decorates it.
 *
 * Registering the capability also puts a row in the AI Power-Ups settings screen, so the model and
 * any extra instructions are configurable per project like any built-in AI feature.
 */
export default createFeature({
    name: "BugReporter/Ai",
    register(container) {
        container.register(BugReportDraftCapability);
        container.registerDecorator(BugReportDrafterDecorator);
    }
});
