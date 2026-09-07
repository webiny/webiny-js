import { Output } from "ai";
import { Ai } from "webiny/api";
import { Encryption } from "webiny/api";
import { Logger } from "webiny/api";
import { GetSettingsUseCase } from "webiny/api/ai-powerups";
/*
 * `IAiPowerUpsSettings` is an empty interface that each settings group augments by declaration
 * merging. The package's emitted .d.ts still carries the unresolved `~/...` specifiers that pull
 * those augmentations in, so from outside the package `providers` is missing until the module is
 * imported by its real path. Drop this once ai-powerups rewrites aliases on build.
 */
import "@webiny/ai-powerups/api/features/Providers/types.js";
import { IssueDrafter as Abstraction } from "./abstractions.js";
import { issueDraftSchema } from "./abstractions.js";
import type { IIssueDraft } from "./abstractions.js";
import type { IBugReportPayload } from "../../shared/types.js";

const SYSTEM_PROMPT = [
    "You turn a spoken or typed bug report from a Webiny team member into a GitHub issue.",
    "You are given their words verbatim, the page they were on, and a timeline of what they",
    "did in the minutes before reporting. Work only from that evidence.",
    "",
    "Write the way an engineer on the team writes: plain, specific, no filler. Never invent a",
    "cause, a stack trace, or a step that is not in the timeline. If the reporter was vague and",
    "the timeline does not fill the gap, say so in the summary rather than guessing.",
    "The timeline is the most reliable part of the input — a failed GraphQL operation or a",
    "console error in it usually IS the bug, so lead with it.",
    "",
    "The title must be one line under 80 characters, specific enough to search for.",
    "Leave stepsToReproduce empty when the timeline does not show them."
].join("\n");

function buildPrompt(payload: IBugReportPayload, timeline: string): string {
    return [
        "## What the reporter said",
        payload.description,
        "",
        "## Where they were",
        `Page: ${payload.environment.page}`,
        `URL: ${payload.environment.url}`,
        `Viewport: ${payload.environment.viewport}`,
        `Browser: ${payload.environment.userAgent}`,
        "",
        "## What they did (most recent last)",
        timeline
    ].join("\n");
}

function buildTitle(description: string): string {
    const firstLine = description.split("\n")[0] ?? "";
    const condensed = firstLine.replace(/\s+/g, " ").trim();
    if (condensed === "") {
        return "Bug report from the admin app";
    }
    if (condensed.length <= 80) {
        return condensed;
    }
    return `${condensed.slice(0, 77)}...`;
}

function buildVerbatimDraft(payload: IBugReportPayload): IIssueDraft {
    return {
        title: buildTitle(payload.description),
        summary: payload.description,
        stepsToReproduce: [],
        expected: "",
        actual: ""
    };
}

class IssueDrafterImpl implements Abstraction.Interface {
    constructor(
        private ai: Ai.Interface,
        private getSettings: GetSettingsUseCase.Interface,
        private encryption: Encryption.Interface,
        private logger: Logger.Interface
    ) {}

    async execute(payload: IBugReportPayload, timeline: string): Promise<IIssueDraft> {
        const settingsResult = await this.getSettings.execute();
        if (settingsResult.isFail()) {
            return buildVerbatimDraft(payload);
        }

        // Same provider resolution as AI image enrichment: whichever preset is configured first.
        const firstProvider = settingsResult.value.providers.presets[0];
        if (!firstProvider) {
            return buildVerbatimDraft(payload);
        }

        const apiKey = await this.encryption.decrypt(firstProvider.apiKeyEncrypted);
        const prompt = buildPrompt(payload, timeline);

        try {
            const result = await this.ai.generateText({
                model: firstProvider.model,
                output: Output.object({ schema: issueDraftSchema }),
                connection: {
                    sdkName: firstProvider.model.split("/")[0],
                    apiKey
                },
                system: SYSTEM_PROMPT,
                messages: [{ role: "user", content: prompt }]
            });

            return {
                title: result.output.title,
                summary: result.output.summary,
                stepsToReproduce: result.output.stepsToReproduce,
                expected: result.output.expected,
                actual: result.output.actual
            };
        } catch (error) {
            // A failed draft must not lose the report — file the reporter's words instead.
            this.logger.error({ error }, "Bug report drafting failed; filing verbatim.");
            return buildVerbatimDraft(payload);
        }
    }
}

export const IssueDrafter = Abstraction.createImplementation({
    implementation: IssueDrafterImpl,
    dependencies: [Ai, GetSettingsUseCase, Encryption, Logger]
});
