import React from "react";
import { Command } from "webiny/admin";
import { Icon } from "webiny/admin/ui";
import { ReactComponent as SettingsIcon } from "webiny/admin/icons/settings.svg";
import { BugReportSettingsPresenter } from "../presentation/settings/abstractions.js";

class BugReportSettingsCommandImpl implements Command.Interface {
    name = "bugReport.settings";
    label = "Bug reporter settings";
    description = "Set the GitHub token, repository and optional Anthropic key";
    category = "Actions";
    keywords = ["bug", "report", "github", "token", "settings"];
    icon = <Icon icon={<SettingsIcon />} size="sm" color="neutral-strong" label="" />;

    constructor(private presenter: BugReportSettingsPresenter.Interface) {}

    execute() {
        this.presenter.open();
    }
}

export const BugReportSettingsCommand = Command.createImplementation({
    implementation: BugReportSettingsCommandImpl,
    dependencies: [BugReportSettingsPresenter]
});
