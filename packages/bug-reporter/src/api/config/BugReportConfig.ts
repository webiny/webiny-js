import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { BugReportConfig as Abstraction } from "./abstractions.js";
import { parseRepository } from "../parseRepository.js";

/* Set from webiny.config.tsx, which reads them from the environment at build time. */
const TOKEN_PARAM = "BUG_REPORT_GITHUB_TOKEN";
const REPOSITORY_PARAM = "BUG_REPORT_REPOSITORY";
const LABELS_PARAM = "BUG_REPORT_LABELS";

const DEFAULT_REPOSITORY = "webiny/webiny-js";

/*
 * Always applied, on top of whatever BUG_REPORT_LABELS says, so these issues can be found and
 * filtered as a group. Not configurable on purpose: it is only useful if it is the same
 * everywhere.
 */
export const TOOL_LABEL = "reported-in-app";

function readParam(params: BuildParams.Interface, key: string): string {
    const value = params.get<string>(key);
    if (typeof value !== "string") {
        return "";
    }
    return value.trim();
}

function parseLabels(raw: string): string[] {
    const labels: string[] = [];

    for (const part of raw.split(",")) {
        const label = part.trim();
        if (label !== "") {
            labels.push(label);
        }
    }

    if (labels.length === 0) {
        labels.push("bug");
    }

    if (!labels.includes(TOOL_LABEL)) {
        labels.push(TOOL_LABEL);
    }

    return labels;
}

export class BugReportConfigImpl implements Abstraction.Interface {
    constructor(private params: BuildParams.Interface) {}

    get token(): string {
        return readParam(this.params, TOKEN_PARAM);
    }

    /*
     * A configured value is validated rather than sniffed for a slash. Falling back on anything
     * that did not look right sent a project that typo'd `BUG_REPORT_REPOSITORY` to OUR issue
     * composer, prefilled with their page titles, URLs and click timeline, and said nothing about
     * it. Throwing surfaces the typo as a failed report instead.
     */
    get repository(): string {
        const configured = readParam(this.params, REPOSITORY_PARAM);
        if (configured === "") {
            return DEFAULT_REPOSITORY;
        }

        parseRepository(configured);
        return configured;
    }

    get labels(): string[] {
        return parseLabels(readParam(this.params, LABELS_PARAM));
    }

    get canFileDirectly(): boolean {
        return this.token !== "";
    }
}

export const BugReportConfig = Abstraction.createImplementation({
    implementation: BugReportConfigImpl,
    dependencies: [BuildParams]
});
