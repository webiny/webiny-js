import { describe, it, expect } from "vitest";
import { composeIssueBody } from "~/api/composeIssueBody.js";
import type { IComposeIssueBodyInput } from "~/api/composeIssueBody.js";
import type { IReportedEnvironment } from "~/shared/types.js";

const ENVIRONMENT: IReportedEnvironment = {
    url: "https://admin.example.com/pages",
    page: "Pages",
    userAgent: "Mozilla/5.0",
    viewport: "1440x900",
    language: "en-US",
    timezone: "Europe/Zagreb",
    capturedAt: "2026-09-18T10:00:00.000Z"
};

function buildInput(overrides: Partial<IComposeIssueBodyInput> = {}): IComposeIssueBodyInput {
    return {
        draft: {
            title: "Publish fails",
            summary: "Publishing a page does nothing.",
            stepsToReproduce: [],
            expected: "",
            actual: ""
        },
        description: "",
        environment: ENVIRONMENT,
        timeline: "_Nothing was recorded._",
        screenshotUrls: [],
        ...overrides
    };
}

describe("composeIssueBody", () => {
    it("omits the optional sections the drafter left empty", () => {
        const body = composeIssueBody(buildInput());

        expect(body).not.toContain("### Steps to reproduce");
        expect(body).not.toContain("### Expected");
        expect(body).not.toContain("### Actual");
        expect(body).not.toContain("### Screenshots");
        expect(body).toContain("### Environment");
        expect(body).toContain("### What the reporter did");
    });

    it("numbers the steps to reproduce", () => {
        const body = composeIssueBody(
            buildInput({ draft: { ...buildInput().draft, stepsToReproduce: ["Open", "Click"] } })
        );

        expect(body).toContain("1. Open\n2. Click");
    });

    it("embeds each screenshot as an image", () => {
        const body = composeIssueBody(
            buildInput({ screenshotUrls: ["https://cdn.example.com/a.png"] })
        );

        expect(body).toContain("![Attachment 1](https://cdn.example.com/a.png)");
    });

    /*
     * A page title is whatever an editor typed. Before escaping, a pipe in it split the cell and
     * pushed the rest of the row out of the table.
     */
    it("escapes pipes so a page title cannot break the environment table", () => {
        const body = composeIssueBody(
            buildInput({ environment: { ...ENVIRONMENT, page: "Pricing | Acme" } })
        );

        expect(body).toContain("| Page | Pricing \\| Acme |");
    });

    it("quotes the reporter's own words, and skips the block when they typed nothing", () => {
        expect(composeIssueBody(buildInput({ description: "it broke\nagain" }))).toContain(
            "> it broke\n> again"
        );
        expect(composeIssueBody(buildInput())).not.toContain("Reported verbatim");
    });
});
