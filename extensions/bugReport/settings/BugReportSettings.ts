import { makeAutoObservable } from "mobx";
import { LocalStorage } from "webiny/admin/local-storage";
import { BugReportSettings as Abstraction } from "./abstractions.js";
import type { IBugReportSettingsValues } from "./abstractions.js";

const STORAGE_KEY = "bugReport.settings";

const DEFAULT_VALUES: IBugReportSettingsValues = {
    githubToken: "",
    repository: "webiny/webiny-js",
    labels: "bug",
    anthropicApiKey: "",
    includeScreenshot: true
};

function readString(source: Record<string, unknown>, key: string, fallback: string): string {
    const value = source[key];
    if (typeof value === "string") {
        return value;
    }
    return fallback;
}

function readStoredValues(storage: LocalStorage.Interface): IBugReportSettingsValues {
    const stored = storage.get<Record<string, unknown>>(STORAGE_KEY);
    if (!stored || typeof stored !== "object") {
        return { ...DEFAULT_VALUES };
    }

    const includeScreenshot = stored.includeScreenshot;

    return {
        githubToken: readString(stored, "githubToken", DEFAULT_VALUES.githubToken),
        repository: readString(stored, "repository", DEFAULT_VALUES.repository),
        labels: readString(stored, "labels", DEFAULT_VALUES.labels),
        anthropicApiKey: readString(stored, "anthropicApiKey", DEFAULT_VALUES.anthropicApiKey),
        includeScreenshot: includeScreenshot !== false
    };
}

/*
 * Keys live in this browser's localStorage and nowhere else — there is no shared bot token
 * and no server component, so issues are filed as the person who actually hit the bug.
 * The tradeoff is a PAT sitting in localStorage: scope it to issues on one repo.
 */
class BugReportSettingsImpl implements Abstraction.Interface {
    private current: IBugReportSettingsValues;

    constructor(private storage: LocalStorage.Interface) {
        this.current = readStoredValues(storage);
        makeAutoObservable<BugReportSettingsImpl, "storage">(this, { storage: false });
    }

    get values(): IBugReportSettingsValues {
        return this.current;
    }

    get isConfigured(): boolean {
        if (this.current.githubToken.trim() === "") {
            return false;
        }
        return this.current.repository.includes("/");
    }

    get labelList(): string[] {
        const labels: string[] = [];

        for (const part of this.current.labels.split(",")) {
            const label = part.trim();
            if (label !== "") {
                labels.push(label);
            }
        }

        return labels;
    }

    update(values: Partial<IBugReportSettingsValues>): void {
        this.current = { ...this.current, ...values };
        this.storage.set(STORAGE_KEY, this.current);
    }
}

export const BugReportSettings = Abstraction.createImplementation({
    implementation: BugReportSettingsImpl,
    dependencies: [LocalStorage]
});
