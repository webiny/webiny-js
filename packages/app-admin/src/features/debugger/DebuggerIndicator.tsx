import React from "react";
import { observer } from "mobx-react-lite";
import { Tag } from "@webiny/admin-ui";
import { ReactComponent as DebuggerIcon } from "@webiny/icons/bug_report.svg";
import { debuggerStore } from "./DebuggerStore.js";
import { downloadReport } from "./report.js";

/**
 * Says that capture is on, and how much has been collected.
 *
 * Renders nothing when the toggle is off, which is the normal state - the header is not the place to
 * advertise a feature nobody switched on. When it is on it is deliberately hard to miss, because
 * leaving capture running is the mistake it exists to prevent.
 *
 * `Tag` rather than a hand-rolled pill: it carries the height, padding and type scale that make it
 * sit level with the tenant selector and the avatar beside it.
 */
export const DebuggerIndicator = observer(() => {
    if (!debuggerStore.enabled) {
        return null;
    }

    const count = debuggerStore.entryCount;

    return (
        <Tag
            variant={"warning"}
            icon={<DebuggerIcon />}
            content={count > 0 ? `Debug mode · ${count}` : "Debug mode"}
            title={
                count > 0
                    ? `Debug capture is on. Click to download ${count} collected entries.`
                    : "Debug capture is on. Nothing collected yet."
            }
            onClick={downloadReport}
            className={"cursor-pointer"}
        />
    );
});
