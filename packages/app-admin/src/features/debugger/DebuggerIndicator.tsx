import React from "react";
import { observer } from "mobx-react-lite";
import { DropdownMenu, Tag } from "@webiny/admin-ui";
import { ReactComponent as DebuggerIcon } from "@webiny/icons/bug_report.svg";
import { debuggerStore } from "./DebuggerStore.js";
import { downloadReport } from "./report.js";

/**
 * Says that capture is on, how much has been collected, and offers the two things worth doing
 * about it.
 *
 * Renders nothing when the toggle is off, which is the normal state - the header is not the place to
 * advertise a feature nobody switched on. When it is on it is deliberately hard to miss, because
 * leaving capture running is the mistake it exists to prevent.
 *
 * Clearing matters as much as downloading: an hour of browsing collects a great deal, and everything
 * held is in memory and lands in the next report whether or not it is relevant to the problem being
 * reproduced.
 */
export const DebuggerIndicator = observer(() => {
    if (!debuggerStore.enabled) {
        return null;
    }

    const count = debuggerStore.entryCount;
    const hasEntries = count > 0;

    return (
        <DropdownMenu
            trigger={
                <Tag
                    variant={"warning"}
                    icon={<DebuggerIcon />}
                    content={hasEntries ? `Debug mode · ${count}` : "Debug mode"}
                    title={
                        hasEntries
                            ? `Debug capture is on. ${count} entries collected.`
                            : "Debug capture is on. Nothing collected yet."
                    }
                    className={"cursor-pointer"}
                />
            }
        >
            <DropdownMenu.Item
                text={"Download report"}
                disabled={!hasEntries}
                onClick={downloadReport}
            />
            <DropdownMenu.Item
                text={"Clear collected data"}
                disabled={!hasEntries}
                onClick={debuggerStore.clear}
            />
        </DropdownMenu>
    );
});
