import { Output } from "ai";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { GetSettingsUseCase } from "@webiny/ai-powerups/api/features/GetSettings/abstractions.js";
/*
 * `IAiPowerUpsSettings` is an empty interface that each settings group fills in by declaration
 * merging, but ai-powerups emits unresolved `~/...` specifiers in its .d.ts, so the augmentation
 * has to be imported by its real path or `settings.providers` is missing. Drop once that package
 * rewrites aliases on build.
 */
import "@webiny/ai-powerups/api/features/Providers/types.js";
import { IssueDrafter as Abstraction } from "./abstractions.js";
import { issueDraftSchema } from "./abstractions.js";
import type { IIssueDraft } from "./abstractions.js";
import type { IBugReportPayload } from "../../shared/types.js";

/*
 * Only the first few images go to the model. They are the expensive part of the request, and a
 * report with more than a handful is attaching context rather than showing the failure.
 */
const MAX_IMAGES_SENT = 3;

const SYSTEM_PROMPT = [
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

function buildPrompt(payload: IBugReportPayload, timeline: string): string {
    const said = payload.description.trim();
    const lines: string[] = ["## What the reporter said"];

    if (said === "") {
        lines.push("_Nothing. They attached screenshots only — read them._");
    } else {
        lines.push(said);
    }

    lines.push(
        "",
        "## Where they were",
        `Page: ${payload.environment.page}`,
        `URL: ${payload.environment.url}`,
        `Viewport: ${payload.environment.viewport}`,
        `Browser: ${payload.environment.userAgent}`,
        "",
        "## What they did (most recent last)",
        timeline
    );

    return lines.join("\n");
}

interface IFilePart {
    type: "file";
    data: string;
    mediaType: string;
}

interface ITextPart {
    type: "text";
    text: string;
}

/*
 * Screenshots go in as base64 file parts, the same way AI image enrichment sends images, and
 * ahead of the text so the model has looked at them before it reads the prompt.
 */
function buildContent(payload: IBugReportPayload, prompt: string): Array<IFilePart | ITextPart> {
    const content: Array<IFilePart | ITextPart> = [];

    for (const screenshot of payload.screenshots.slice(0, MAX_IMAGES_SENT)) {
        content.push({
            type: "file",
            data: screenshot.base64,
            mediaType: screenshot.mediaType
        });
    }

    content.push({ type: "text", text: prompt });

    return content;
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
                messages: [{ role: "user", content: buildContent(payload, prompt) }]
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
