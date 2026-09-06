import Anthropic from "@anthropic-ai/sdk";
import { BugReportSettings } from "../settings/abstractions.js";
import { IssueDrafter as Abstraction } from "./abstractions.js";
import type { IDraftIssueInput } from "./abstractions.js";
import type { IIssueDraft } from "./abstractions.js";

const MODEL = "claude-opus-5";

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
    "Always call the draft_issue tool."
].join("\n");

const DRAFT_ISSUE_TOOL: Anthropic.Tool = {
    name: "draft_issue",
    description: "File the reporter's words as a structured GitHub issue.",
    input_schema: {
        type: "object",
        properties: {
            title: {
                type: "string",
                description: "One line, under 80 characters, specific enough to search for."
            },
            summary: {
                type: "string",
                description: "Two or three sentences on what broke and where."
            },
            steps_to_reproduce: {
                type: "array",
                items: { type: "string" },
                description:
                    "Steps drawn from the timeline. Empty if the timeline does not show them."
            },
            expected: { type: "string", description: "What the reporter expected to happen." },
            actual: { type: "string", description: "What happened instead." },
            extra_labels: {
                type: "array",
                items: { type: "string" },
                description: "At most two extra labels, e.g. an affected area. Empty is fine."
            }
        },
        required: ["title", "summary", "steps_to_reproduce", "expected", "actual"],
        additionalProperties: false
    }
};

function buildPrompt(input: IDraftIssueInput): string {
    return [
        "## What the reporter said",
        input.description,
        "",
        "## Where they were",
        `Page: ${input.environment.page}`,
        `URL: ${input.environment.url}`,
        `Viewport: ${input.environment.viewport}`,
        `Browser: ${input.environment.userAgent}`,
        "",
        "## What they did (most recent last)",
        input.timeline
    ].join("\n");
}

function readStringList(source: Record<string, unknown>, key: string): string[] {
    const value = source[key];
    if (!Array.isArray(value)) {
        return [];
    }

    const items: string[] = [];
    for (const item of value) {
        if (typeof item === "string" && item.trim() !== "") {
            items.push(item.trim());
        }
    }

    return items;
}

function readString(source: Record<string, unknown>, key: string, fallback: string): string {
    const value = source[key];
    if (typeof value === "string" && value.trim() !== "") {
        return value.trim();
    }
    return fallback;
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

/*
 * Used when no Anthropic key is configured, and when the model fails to come back with a
 * usable draft. Filing the reporter's own words plus the timeline is still a good issue —
 * the drafting step is polish, not the point.
 */
function buildVerbatimDraft(input: IDraftIssueInput): IIssueDraft {
    return {
        title: buildTitle(input.description),
        summary: input.description,
        stepsToReproduce: [],
        expected: "",
        actual: "",
        labels: input.labels
    };
}

function readDraft(input: IDraftIssueInput, payload: Record<string, unknown>): IIssueDraft {
    const labels = [...input.labels];

    for (const extra of readStringList(payload, "extra_labels").slice(0, 2)) {
        if (!labels.includes(extra)) {
            labels.push(extra);
        }
    }

    return {
        title: readString(payload, "title", buildTitle(input.description)),
        summary: readString(payload, "summary", input.description),
        stepsToReproduce: readStringList(payload, "steps_to_reproduce"),
        expected: readString(payload, "expected", ""),
        actual: readString(payload, "actual", ""),
        labels
    };
}

class IssueDrafterImpl implements Abstraction.Interface {
    constructor(private settings: BugReportSettings.Interface) {}

    async draft(input: IDraftIssueInput): Promise<IIssueDraft> {
        const apiKey = this.settings.values.anthropicApiKey.trim();
        if (apiKey === "") {
            return buildVerbatimDraft(input);
        }

        const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
        const prompt = buildPrompt(input);

        const response = await client.messages.create({
            model: MODEL,
            max_tokens: 16000,
            system: SYSTEM_PROMPT,
            tools: [DRAFT_ISSUE_TOOL],
            tool_choice: { type: "tool", name: "draft_issue" },
            messages: [{ role: "user", content: prompt }]
        });

        const block = response.content.find(item => item.type === "tool_use");
        if (!block || block.type !== "tool_use") {
            return buildVerbatimDraft(input);
        }

        if (!block.input || typeof block.input !== "object") {
            return buildVerbatimDraft(input);
        }

        const payload = block.input as Record<string, unknown>;
        return readDraft(input, payload);
    }
}

export const IssueDrafter = Abstraction.createImplementation({
    implementation: IssueDrafterImpl,
    dependencies: [BugReportSettings]
});
