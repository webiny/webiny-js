import React from "react";
import { Command } from "@webiny/app-admin/presentation/commandPalette/index.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";
import { ActionRecorder } from "../recording/abstractions.js";
import { collectEnvironment } from "../capture/collectEnvironment.js";
import { writeReportToClipboard } from "../clipboard/writeReportToClipboard.js";
import type { IBugReportPayload } from "../../shared/types.js";

function describeFailure(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

/*
 * The dialog's "Copy to clipboard" without the dialog, for someone already writing the report in
 * Slack: run it, paste, and the timeline and environment are there under their own words.
 *
 * Nothing typed and nothing pasted, so the copy is the captured context alone. A toast confirms it,
 * because the palette closes on run and leaves nothing on screen that could say so.
 */
class CopyBugReportCommandImpl implements Command.Interface {
    name = "bugReport.copy";
    label = "Copy bug report";
    description = "Copy what you did and where to the clipboard, ready to paste into Slack or mail";
    category = "Actions";
    keywords = ["bug", "report", "copy", "clipboard", "slack", "trace", "timeline", "debug"];
    icon = <Icon icon={<CopyIcon />} size="sm" color="neutral-strong" label="" />;

    constructor(
        private recorder: ActionRecorder.Interface,
        private notifications: Notifications.Interface
    ) {}

    async execute() {
        const reportedAt = Date.now();
        const events = this.recorder.getEvents();
        const environment = collectEnvironment();

        const payload: IBugReportPayload = {
            description: "",
            reportedAt,
            events,
            environment,
            screenshots: []
        };

        try {
            await writeReportToClipboard(payload);
            this.notifications.success({ title: "Bug report copied to clipboard" });
        } catch (error) {
            this.notifications.warning({
                title: "Could not copy the bug report",
                description: describeFailure(error)
            });
        }
    }
}

export const CopyBugReportCommand = Command.createImplementation({
    implementation: CopyBugReportCommandImpl,
    dependencies: [ActionRecorder, Notifications]
});
