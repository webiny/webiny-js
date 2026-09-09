import React from "react";
import { observer } from "mobx-react-lite";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { useScheduledActionsPresenter } from "~/hooks/useScheduledActionsPresenter.js";
import { LiveTag } from "./LiveTag.js";
import { ScheduledTag } from "./ScheduledTag.js";
import { isScheduleRedundant } from "./isScheduleRedundant.js";

/**
 * Overrides the CMS "Live" column cell to surface scheduled publish/unpublish actions.
 *
 * The data comes from ScheduledActionsPresenter, which the content-entries list presenter decorator
 * keeps loaded for the current model. An entry can be live AND have a scheduled action (e.g. a new
 * revision scheduled to publish), so both are shown when both apply.
 */
export const CellLive = observer(() => {
    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const presenter = useScheduledActionsPresenter();

    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    const entry = row.data;
    const liveVersion = entry.live?.version;

    const rawScheduled = presenter.getScheduledAction(entry.id);
    // Ignore a scheduled action the entry's current state has already made redundant (see helper).
    const scheduled =
        rawScheduled && !isScheduleRedundant(rawScheduled, liveVersion, entry.meta?.version)
            ? rawScheduled
            : undefined;

    const lastPublishedOn = entry.lastPublishedOn;

    // Live now AND a change scheduled — show both, wrapping to a second line if the column is narrow.
    if (liveVersion && scheduled) {
        return (
            <div className={"flex flex-wrap items-center gap-xs"}>
                <LiveTag version={liveVersion} lastPublishedOn={lastPublishedOn} />
                <ScheduledTag scheduled={scheduled} />
            </div>
        );
    }

    if (scheduled) {
        return <ScheduledTag scheduled={scheduled} />;
    }

    if (!liveVersion) {
        return <>No</>;
    }

    return <LiveTag version={liveVersion} lastPublishedOn={lastPublishedOn} />;
});
