import React from "react";
import { Command } from "@webiny/app-admin/presentation/commandPalette/index.js";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as BugIcon } from "@webiny/icons/bug_report.svg";
import { ReportBugPresenter } from "../presentation/report/abstractions.js";

class ReportBugCommandImpl implements Command.Interface {
    name = "bugReport.report";
    label = "Report a bug";
    description = "Say what went wrong; the context is attached for you";
    category = "Actions";
    keywords = ["bug", "issue", "report", "feedback", "github", "broken"];
    shortcut = "cmd+shift+b";
    icon = <Icon icon={<BugIcon />} size="sm" color="neutral-strong" label="" />;

    constructor(private presenter: ReportBugPresenter.Interface) {}

    execute() {
        this.presenter.open();
    }
}

export const ReportBugCommand = Command.createImplementation({
    implementation: ReportBugCommandImpl,
    dependencies: [ReportBugPresenter]
});
