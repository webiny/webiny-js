import { Output } from "ai";
import { z } from "zod";
import { Ai } from "webiny/api";
import { Logger } from "webiny/api";
import { ResolveAiCapabilityUseCase } from "webiny/api/ai-powerups";
import { withAdditionalInstructions } from "webiny/api/ai-powerups";
import { IssueDrafter } from "webiny/api/bug-reporter";
import type { IBugReportPayload } from "webiny/api/bug-reporter";
import { BUG_REPORT_DRAFT_CAPABILITY } from "./capability.js";

/*
 * Only the first few images go to the model. They are the expensive part of the request, and a
 * report with more than a handful is attaching context rather than showing the failure.
 */
const MAX_IMAGES_SENT = 3;

/*
 * Exported as the bare zod schema rather than a ready-made `Output.object(...)`: the AI SDK's
 * `Output` type can't be named in emitted declarations (TS4023), so the call site wraps it.
 */
const issueDraftSchema = z.object({
    title: z.string(),
    summary: z.string(),
    stepsToReproduce: z.array(z.string()),
    expected: z.string(),
    actual: z.string()
});

interface IFilePart {
    type: "file";
    data: string;
    mediaType: string;
}

interface ITextPart {
    type: "text";
    text: string;
}

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

/*
 * Turns a filed report into a searchable title plus steps to reproduce.
 *
 * A decorator rather than a replacement because the base drafter is the fallback, and it is used on
 * two of the three paths through here: no model role configured, and the model call failing. Only
 * a successful draft discards it. Losing a report because drafting broke would be the worst
 * possible trade — the reporter has already spent the effort.
 */
class BugReportDrafterDecoratorImpl implements IssueDrafter.Interface {
    constructor(
        private resolveCapability: ResolveAiCapabilityUseCase.Interface,
        private ai: Ai.Interface,
        private logger: Logger.Interface,
        private decoratee: IssueDrafter.Interface
    ) {}

    async execute(payload: IBugReportPayload, timeline: string): Promise<IssueDrafter.Draft> {
        const verbatim = await this.decoratee.execute(payload, timeline);

        const resolved = await this.resolveCapability.execute(BUG_REPORT_DRAFT_CAPABILITY);
        if (resolved.isFail()) {
            return verbatim;
        }

        const capability = resolved.value;
        const prompt = buildPrompt(payload, timeline);

        const output = Output.object({ schema: issueDraftSchema });
        const system = withAdditionalInstructions(capability);
        const content = buildContent(payload, prompt);

        try {
            const result = await this.ai.generateText({
                model: capability.model,
                connection: capability.connection,
                output,
                system,
                messages: [{ role: "user", content }]
            });

            return {
                title: result.output.title,
                summary: result.output.summary,
                stepsToReproduce: result.output.stepsToReproduce,
                expected: result.output.expected,
                actual: result.output.actual
            };
        } catch (error) {
            this.logger.error({ error }, "Bug report drafting failed; filing verbatim.");
            return verbatim;
        }
    }
}

export const BugReportDrafterDecorator = IssueDrafter.createDecorator({
    decorator: BugReportDrafterDecoratorImpl,
    dependencies: [ResolveAiCapabilityUseCase, Ai, Logger]
});
