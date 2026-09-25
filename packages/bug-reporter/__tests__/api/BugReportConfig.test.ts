import { describe, it, expect } from "vitest";
import { BugReportConfigImpl, TOOL_LABEL } from "~/api/config/BugReportConfig.js";
import type { BuildParams } from "@webiny/api-core/features/buildParams/index.js";

function buildConfig(params: Record<string, string>) {
    const buildParams = {
        get: (key: string) => params[key]
    } as BuildParams.Interface;

    return new BugReportConfigImpl(buildParams);
}

describe("BugReportConfig", () => {
    it("falls back to the Webiny repository when none is configured", () => {
        expect(buildConfig({}).repository).toBe("webiny/webiny-js");
    });

    it("uses a configured repository", () => {
        expect(buildConfig({ BUG_REPORT_REPOSITORY: "acme/app" }).repository).toBe("acme/app");
    });

    /*
     * The fallback used to trigger on anything without a slash, so a project that typo'd this sent
     * its reporters to our issue composer, prefilled with their page titles and click timeline, and
     * said nothing about it.
     */
    it.each([["acme-app"], ["acme/app/extra"], ["https://github.com/acme/app"]])(
        "refuses %j rather than quietly falling back to ours",
        repository => {
            expect(() => buildConfig({ BUG_REPORT_REPOSITORY: repository }).repository).toThrow(
                /not a valid repository/
            );
        }
    );

    /*
     * Filing is the irreversible direction. A token with no repository used to file into the
     * default, which is ours, under the project's own PAT and with nobody reviewing it.
     */
    it("needs a token AND an explicit repository before it will file directly", () => {
        expect(buildConfig({}).canFileDirectly).toBe(false);
        expect(buildConfig({ BUG_REPORT_GITHUB_TOKEN: "t" }).canFileDirectly).toBe(false);
        expect(buildConfig({ BUG_REPORT_REPOSITORY: "acme/app" }).canFileDirectly).toBe(false);
        expect(
            buildConfig({ BUG_REPORT_GITHUB_TOKEN: "t", BUG_REPORT_REPOSITORY: "acme/app" })
                .canFileDirectly
        ).toBe(true);
    });

    it("always applies the tool label, on top of whatever is configured", () => {
        expect(buildConfig({}).labels).toEqual(["bug", TOOL_LABEL]);
        expect(buildConfig({ BUG_REPORT_LABELS: "bug, ui ,," }).labels).toEqual([
            "bug",
            "ui",
            TOOL_LABEL
        ]);
    });
});
