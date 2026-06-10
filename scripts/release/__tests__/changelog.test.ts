import { describe, it, expect, vi, beforeEach } from "vitest";
import { Changelog } from "../src/Changelog";

vi.mock("execa", () => ({
    default: vi.fn()
}));

vi.useFakeTimers();
vi.setSystemTime(new Date("2025-06-15"));

import execa from "execa";

const mockedExeca = vi.mocked(execa);
const DELIMITER = "---commit-delimiter---";
const REPO = "https://github.com/webiny/webiny-js";

function mockResult(stdout: string) {
    return {
        stdout,
        stderr: "",
        command: "",
        exitCode: 0,
        failed: false,
        killed: false,
        timedOut: false
    } as any;
}

function mockGitLog(entries: string[], fullBodies?: string[]) {
    mockedExeca.mockResolvedValueOnce(mockResult(entries.map(e => e + DELIMITER).join("\n")));

    if (fullBodies) {
        mockedExeca.mockResolvedValueOnce(
            mockResult(fullBodies.map(b => b + DELIMITER).join("\n"))
        );
    } else {
        mockedExeca.mockResolvedValueOnce(
            mockResult(
                entries
                    .map(e => {
                        const space = e.indexOf(" ");
                        return e.substring(space + 1) + DELIMITER;
                    })
                    .join("\n")
            )
        );
    }
}

function title(from: string, to: string) {
    const version = to.replace(/^v/, "");
    return `# [${version}](${REPO}/compare/${from}...${to}) (2025-06-15)`;
}

describe("Changelog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should include title with version, compare URL, and date", async () => {
        mockGitLog(["abc1234 feat: something (#100)"]);

        const changelog = new Changelog("/tmp");
        const output = await changelog.generate("v1.0.0", "v2.0.0");

        expect(output).toContain(`# [2.0.0](${REPO}/compare/v1.0.0...v2.0.0) (2025-06-15)`);
    });

    it("should link to PR when commit has PR number", async () => {
        mockGitLog(["abc1234567890 feat: add login page (#5010)"]);

        const changelog = new Changelog("/tmp");
        const output = await changelog.generate("v1.0.0", "v2.0.0");

        expect(output).toContain(`* add login page ([#5010](${REPO}/pull/5010))`);
    });

    it("should link to commit when no PR number", async () => {
        mockGitLog(["abc1234567890 feat: quick fix"]);

        const changelog = new Changelog("/tmp");
        const output = await changelog.generate("v1.0.0", "v2.0.0");

        expect(output).toContain(`* quick fix ([abc1234](${REPO}/commit/abc1234567890))`);
    });

    it("should group commits by type with scope", async () => {
        mockGitLog([
            "aaa0000000000 feat: add login page (#100)",
            "bbb0000000000 fix: resolve crash (#101)",
            "ccc0000000000 feat(auth): support OAuth2 (#102)",
            "ddd0000000000 chore: update deps (#103)",
            "eee0000000000 fix(api): handle null response (#104)"
        ]);

        const changelog = new Changelog("/tmp");
        const output = await changelog.generate("v1.0.0", "v2.0.0");

        expect(output).toBe(
            [
                title("v1.0.0", "v2.0.0"),
                "",
                "### Features",
                "",
                `* add login page ([#100](${REPO}/pull/100))`,
                `* **auth:** support OAuth2 ([#102](${REPO}/pull/102))`,
                "",
                "### Bug Fixes",
                "",
                `* resolve crash ([#101](${REPO}/pull/101))`,
                `* **api:** handle null response ([#104](${REPO}/pull/104))`
            ].join("\n")
        );
    });

    it("should ignore non-conventional commits", async () => {
        mockGitLog([
            "aaa0000000000 feat: real feature (#100)",
            "bbb0000000000 Merge branch 'main'",
            "ccc0000000000 random message",
            "ddd0000000000 WIP stuff"
        ]);

        const changelog = new Changelog("/tmp");
        const output = await changelog.generate("v1.0.0", "v2.0.0");

        expect(output).toBe(
            [
                title("v1.0.0", "v2.0.0"),
                "",
                "### Features",
                "",
                `* real feature ([#100](${REPO}/pull/100))`
            ].join("\n")
        );
    });

    it("should detect BREAKING CHANGE in commit body", async () => {
        mockGitLog(
            [
                "aaa0000000000 feat(auth): new auth flow (#100)",
                "bbb0000000000 fix(api): update response (#101)"
            ],
            [
                "feat(auth): new auth flow (#100)\n\nBREAKING CHANGE: removed legacy login endpoint",
                "fix(api): update response (#101)\n\nBREAKING CHANGE: response shape changed"
            ]
        );

        const changelog = new Changelog("/tmp");
        const output = await changelog.generate("v1.0.0", "v2.0.0");

        expect(output).toBe(
            [
                title("v1.0.0", "v2.0.0"),
                "",
                "### BREAKING CHANGES",
                "",
                "* **auth:** removed legacy login endpoint",
                "* **api:** response shape changed",
                "",
                "### Features",
                "",
                `* **auth:** new auth flow ([#100](${REPO}/pull/100))`,
                "",
                "### Bug Fixes",
                "",
                `* **api:** update response ([#101](${REPO}/pull/101))`
            ].join("\n")
        );
    });

    it("should handle all supported types in correct order", async () => {
        mockGitLog([
            "aaa0000000000 feat: a feature (#1)",
            "bbb0000000000 fix: a fix (#2)",
            "ccc0000000000 refactor: a refactor (#3)"
        ]);

        const changelog = new Changelog("/tmp");
        const output = await changelog.generate("v1.0.0", "v2.0.0");

        expect(output).toBe(
            [
                title("v1.0.0", "v2.0.0"),
                "",
                "### Features",
                "",
                `* a feature ([#1](${REPO}/pull/1))`,
                "",
                "### Bug Fixes",
                "",
                `* a fix ([#2](${REPO}/pull/2))`,
                "",
                "### Code Refactoring",
                "",
                `* a refactor ([#3](${REPO}/pull/3))`
            ].join("\n")
        );
    });

    it("should return only title when no matching commits", async () => {
        mockGitLog([
            "aaa0000000000 chore: update deps (#1)",
            "bbb0000000000 docs: update readme (#2)"
        ]);

        const changelog = new Changelog("/tmp");
        const output = await changelog.generate("v1.0.0", "v2.0.0");

        expect(output).toBe(title("v1.0.0", "v2.0.0"));
    });
});
