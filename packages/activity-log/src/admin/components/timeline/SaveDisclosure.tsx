import React from "react";
import { Alert, Text } from "@webiny/admin-ui";
import { discloseItem } from "~/admin/timeline/summariseItem.js";
import type { TimelineItem } from "~/admin/timeline/collapseConsecutive.js";
import { RunLine } from "./RunLine.js";

/**
 * What one row discloses when opened: its runs, newest first, as a ledger.
 *
 * No boxes and no indentation carrying the nesting — the time column does that. Four levels were
 * previously legible only by putting each inside the last, which is what made an expansion read as
 * a form rather than as a history.
 */
export const SaveDisclosure = ({ item }: { item: TimelineItem }) => {
    const disclosure = discloseItem(item);

    return (
        // `AccordionContent` hardcodes its own padding with no way to pass a class through it:
        // `pl-xxl pr-xxl` insets the ledger from both edges, `text-md` oversizes every line in it,
        // and `pb-lg` leaves 24px below the last save. The negative margins cancel all of it so
        // the expansion sets its own — 12px above the first run and 12px below the last, counted
        // from the border rather than from whatever the slot happened to add.
        //
        // The bottom one only became visible when the disclosure note was removed: the note used
        // to fill the 24px, so the expansion ended in a hole the moment it went.
        <div className={"-mx-xxl -mb-lg border-t-sm border-neutral-dimmed pt-xs pr-md pb-xs pl-md"}>
            {disclosure.runs.map(run => (
                <RunLine key={run.id} run={run} />
            ))}
            {disclosure.truncated ? (
                <Alert type={"warning"} variant={"subtle"} icon={null} className={"mt-xs"}>
                    <Text size={"sm"}>
                        More fields changed than are listed. The rest were rolled up to a common
                        parent.
                    </Text>
                </Alert>
            ) : null}
        </div>
    );
};
