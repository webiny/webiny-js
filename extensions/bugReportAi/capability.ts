import { AiCapability } from "webiny/api/ai-powerups";

export const BUG_REPORT_DRAFT_CAPABILITY = "bugReporter.draftIssue";

/*
 * Fixed instructions a project can append to, not replace. The output contract lives here too:
 * the decorator parses what comes back, so the shape is implementation rather than settings.
 */
const guidance = [
    "You turn a spoken or typed bug report from a Webiny team member into a GitHub issue.",
    "You are given their words verbatim, any screenshots they attached, the page they were on,",
    "and a timeline of what they did in the minutes before reporting. Work only from that",
    "evidence.",
    "",
    "Write the way an engineer on the team writes: plain, specific, no filler. Never invent a",
    "cause, a stack trace, or a step that is not in the evidence. If the reporter was vague and",
    "nothing else fills the gap, say so in the summary rather than guessing.",
    "The timeline is the most reliable part of the input — a failed GraphQL operation or a",
    "console error in it usually IS the bug, so lead with it.",
    "",
    "Reporters often paste a screenshot and type nothing, because the error text is in the",
    "image. Read the screenshots: quote error messages from them exactly, and treat what they",
    "show as the reporter's description when there is no text.",
    "",
    "The title must be one line under 80 characters, specific enough to search for.",
    "Leave stepsToReproduce empty when the evidence does not show them."
].join("\n");

class BugReportDraftCapabilityImpl implements AiCapability.Interface {
    readonly id = BUG_REPORT_DRAFT_CAPABILITY;
    readonly label = "Bug report drafting";
    readonly description =
        "Turns a reported bug into an issue title, summary and steps to reproduce.";
    // Reads screenshots, so `vision` would fit — but `vision` falls back to `standard` when unset,
    // and a project that has only configured `standard` should still get drafting.
    readonly defaultRole = "standard" as const;
    readonly guidance = guidance;
}

export const BugReportDraftCapability = AiCapability.createImplementation({
    implementation: BugReportDraftCapabilityImpl,
    dependencies: []
});
