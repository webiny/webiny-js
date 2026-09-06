import { makeAutoObservable } from "mobx";
import { BugReportSettings } from "../../settings/abstractions.js";
import type { IBugReportSettingsValues } from "../../settings/abstractions.js";
import { BugReportSettingsPresenter as Abstraction } from "./abstractions.js";
import type { IBugReportSettingsViewModel } from "./abstractions.js";

function buildHint(values: IBugReportSettingsValues): string | null {
    if (values.githubToken.trim() === "") {
        return "A fine-grained token with read and write access to issues on this repository is enough.";
    }

    if (!values.repository.includes("/")) {
        return "The repository goes in the owner/name form, e.g. webiny/webiny-js.";
    }

    if (values.anthropicApiKey.trim() === "") {
        return "Without an Anthropic key the report is filed word for word, with the timeline attached.";
    }

    return null;
}

class BugReportSettingsPresenterImpl implements Abstraction.Interface {
    private isOpen = false;
    private draft: IBugReportSettingsValues;

    constructor(private settings: BugReportSettings.Interface) {
        this.draft = { ...settings.values };
        makeAutoObservable<BugReportSettingsPresenterImpl, "settings">(this, { settings: false });
    }

    get vm(): IBugReportSettingsViewModel {
        return {
            open: this.isOpen,
            values: this.draft,
            canSave: this.draft.githubToken.trim() !== "" && this.draft.repository.includes("/"),
            hint: buildHint(this.draft)
        };
    }

    open(): void {
        this.draft = { ...this.settings.values };
        this.isOpen = true;
    }

    close(): void {
        this.isOpen = false;
    }

    change(values: Partial<IBugReportSettingsValues>): void {
        this.draft = { ...this.draft, ...values };
    }

    save(): void {
        this.settings.update(this.draft);
        this.isOpen = false;
    }
}

export const BugReportSettingsPresenter = Abstraction.createImplementation({
    implementation: BugReportSettingsPresenterImpl,
    dependencies: [BugReportSettings]
});
