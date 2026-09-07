import type { IReportedEnvironment } from "../shared/types.js";
import type { IIssueDraft } from "./drafter/abstractions.js";

export interface IComposeIssueBodyInput {
    draft: IIssueDraft;
    description: string;
    environment: IReportedEnvironment;
    timeline: string;
    screenshotUrl: string | null;
}

function buildEnvironmentTable(environment: IReportedEnvironment): string {
    const rows = [
        ["Page", environment.page],
        ["URL", environment.url],
        ["Viewport", environment.viewport],
        ["Browser", environment.userAgent],
        ["Language", environment.language],
        ["Timezone", environment.timezone],
        ["Captured", environment.capturedAt]
    ];

    const lines = ["| | |", "|---|---|"];

    for (const [key, value] of rows) {
        lines.push(`| ${key} | ${value} |`);
    }

    return lines.join("\n");
}

/*
 * The model writes the prose. Everything below it — screenshot, environment, timeline — is
 * assembled here from the captured data, so the machine-readable half of the issue is
 * exactly what was recorded and not a paraphrase of it.
 */
export function composeIssueBody(input: IComposeIssueBodyInput): string {
    const sections: string[] = [input.draft.summary];

    if (input.draft.stepsToReproduce.length > 0) {
        sections.push("### Steps to reproduce");
        const steps: string[] = [];
        input.draft.stepsToReproduce.forEach((step, index) => {
            steps.push(`${index + 1}. ${step}`);
        });
        sections.push(steps.join("\n"));
    }

    if (input.draft.expected !== "") {
        sections.push("### Expected");
        sections.push(input.draft.expected);
    }

    if (input.draft.actual !== "") {
        sections.push("### Actual");
        sections.push(input.draft.actual);
    }

    if (input.screenshotUrl) {
        sections.push("### Screenshot");
        sections.push(`![Screenshot at the moment of reporting](${input.screenshotUrl})`);
    }

    sections.push("### Environment");
    sections.push(buildEnvironmentTable(input.environment));

    sections.push("### What the reporter did");
    sections.push(input.timeline);

    sections.push("<details><summary>Reported verbatim</summary>\n");
    sections.push(`> ${input.description.split("\n").join("\n> ")}`);
    sections.push("</details>");

    sections.push("---");
    sections.push("_Filed from the Webiny admin app by the bug reporter extension._");

    return sections.join("\n\n");
}
