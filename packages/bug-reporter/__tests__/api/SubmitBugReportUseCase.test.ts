import { describe, it, expect, vi } from "vitest";
import { AnonymousIdentity } from "@webiny/api-core/features/security/IdentityContext/AnonymousIdentity.js";
import { AuthenticatedIdentity } from "@webiny/api-core/features/security/IdentityContext/AuthenticatedIdentity.js";
import { SubmitBugReportUseCaseImpl } from "~/api/submitBugReport/SubmitBugReportUseCase.js";
import type { BugReportConfig } from "~/api/config/abstractions.js";
import type { GitHubIssueGateway } from "~/api/github/abstractions.js";
import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { IssueDrafter } from "~/api/drafter/abstractions.js";
import type { BugReportStreamEvent } from "~/shared/types.js";
import type { IBugReportPayload } from "~/shared/types.js";

const PAYLOAD: IBugReportPayload = {
    description: "Publishing does nothing.",
    reportedAt: 1_000_000,
    events: [{ at: 999_000, kind: "click", summary: "Publish" }],
    environment: {
        url: "https://admin.example.com/pages",
        page: "Pages",
        userAgent: "Mozilla/5.0",
        viewport: "1440x900",
        language: "en-US",
        timezone: "Europe/Zagreb",
        capturedAt: "2026-09-18T10:00:00.000Z"
    },
    screenshots: []
};

const DRAFT: IssueDrafter.Draft = {
    title: "Publish fails",
    summary: "Publishing a page does nothing.",
    stepsToReproduce: [],
    expected: "",
    actual: ""
};

function buildIdentityContext(anonymous: boolean): IdentityContext.Interface {
    const identity = anonymous
        ? new AnonymousIdentity()
        : new AuthenticatedIdentity({ id: "1", displayName: "Ada", type: "admin" });

    return { getIdentity: () => identity } as IdentityContext.Interface;
}

function buildConfig(overrides: Partial<BugReportConfig.Interface> = {}) {
    return {
        token: "",
        repository: "webiny/webiny-js",
        labels: ["bug"],
        canFileDirectly: false,
        ...overrides
    } satisfies BugReportConfig.Interface;
}

function buildGateway(overrides: Partial<GitHubIssueGateway.Interface> = {}) {
    return {
        uploadScreenshot: vi.fn(async () => "https://cdn.example.com/a.png"),
        createIssue: vi.fn(async () => ({ number: 7, url: "https://github.com/w/w/issues/7" })),
        ...overrides
    };
}

function buildUseCase(
    options: {
        anonymous?: boolean;
        config?: Partial<BugReportConfig.Interface>;
        drafter?: IssueDrafter.Interface;
        github?: GitHubIssueGateway.Interface;
    } = {}
) {
    const github = options.github ?? buildGateway();
    const drafter = options.drafter ?? { execute: vi.fn(async () => DRAFT) };

    const useCase = new SubmitBugReportUseCaseImpl(
        buildIdentityContext(options.anonymous ?? false),
        buildConfig(options.config),
        drafter,
        github
    );

    return { useCase, github, drafter };
}

async function collect(stream: AsyncGenerator<BugReportStreamEvent>) {
    const events: BugReportStreamEvent[] = [];
    for await (const event of stream) {
        events.push(event);
    }
    return events;
}

describe("SubmitBugReportUseCase", () => {
    /*
     * The one that matters: filing runs under the server's GitHub token, so an anonymous caller
     * reaching this would be opening issues and committing files under our PAT.
     */
    it("refuses an anonymous caller before touching GitHub", async () => {
        const { useCase, github, drafter } = buildUseCase({ anonymous: true });

        const result = await useCase.execute(PAYLOAD);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("BUG_REPORT_NOT_AUTHORIZED");
        expect(drafter.execute).not.toHaveBeenCalled();
        expect(github.createIssue).not.toHaveBeenCalled();
    });

    it("refuses a report with neither a description nor a screenshot", async () => {
        const { useCase } = buildUseCase();

        const result = await useCase.execute({ ...PAYLOAD, description: "   " });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("BUG_REPORT_EMPTY");
    });

    it("accepts a screenshot with no description, since the error text is often in it", async () => {
        const { useCase } = buildUseCase();

        const result = await useCase.execute({
            ...PAYLOAD,
            description: "",
            screenshots: [{ mediaType: "image/png", base64: "AA" }]
        });

        expect(result.isOk()).toBe(true);
    });

    it("hands back a compose URL when there is no token to file with", async () => {
        const { useCase, github } = buildUseCase();

        const result = await useCase.execute(PAYLOAD);
        const events = await collect(result.value);

        expect(events[0]).toEqual({ type: "drafting" });
        expect(events[1]?.type).toBe("compose");
        expect(github.createIssue).not.toHaveBeenCalled();
    });

    it("uploads each screenshot and then files the issue when it can", async () => {
        const { useCase, github } = buildUseCase({
            config: { token: "t", canFileDirectly: true }
        });

        const result = await useCase.execute({
            ...PAYLOAD,
            screenshots: [
                { mediaType: "image/png", base64: "AA" },
                { mediaType: "image/png", base64: "BB" }
            ]
        });
        const events = await collect(result.value);

        expect(events).toEqual([
            { type: "drafting" },
            { type: "uploading", index: 1, total: 2 },
            { type: "uploading", index: 2, total: 2 },
            { type: "creating" },
            { type: "filed", url: "https://github.com/w/w/issues/7", number: 7 }
        ]);
        expect(github.uploadScreenshot).toHaveBeenCalledTimes(2);
        expect(github.createIssue).toHaveBeenCalledWith(
            expect.objectContaining({ title: "Publish fails", labels: ["bug"] })
        );
    });

    /*
     * The stream has already committed to a 200 by the time GitHub is called, so a failure there
     * has to arrive as an event rather than as a rejected promise.
     */
    it("reports a GitHub failure as a stream event, not a throw", async () => {
        const github = buildGateway({
            createIssue: vi.fn(async () => {
                throw new Error("GitHub responded 403: Bad credentials");
            })
        });
        const { useCase } = buildUseCase({ config: { canFileDirectly: true }, github });

        const result = await useCase.execute(PAYLOAD);
        const events = await collect(result.value);

        expect(events.at(-1)).toEqual({
            type: "error",
            message: "GitHub responded 403: Bad credentials"
        });
    });
});
