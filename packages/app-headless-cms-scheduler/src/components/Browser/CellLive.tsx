import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as ScheduledIcon } from "@webiny/icons/access_time.svg";
import { Tag, Tooltip } from "@webiny/admin-ui";
import { useContainer } from "@webiny/app";
import { useModel } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { ListScheduledActionsGateway } from "@webiny/app-scheduler/features/listScheduledActions/abstractions.js";
import { ScheduleActionType } from "@webiny/app-scheduler/types.js";
import type { SchedulerEntry } from "@webiny/app-scheduler/types.js";
import { createNamespace, formatScheduledDate } from "~/utils/index.js";
import { scheduledActionsStore } from "./ScheduledActionsStore.js";
import { schedulerMutationSignal } from "../schedulerMutationSignal.js";

const scheduledTooltip = (scheduled: SchedulerEntry): string => {
    const goLiveOn = scheduled.publishOn || scheduled.unpublishOn;
    const actionLabel =
        scheduled.actionType === ScheduleActionType.unpublish ? "unpublish" : "publish";
    return goLiveOn
        ? `Scheduled to ${actionLabel} on ${formatScheduledDate(goLiveOn)}`
        : `Scheduled to ${actionLabel}`;
};

const ScheduledTag = ({ scheduled }: { scheduled: SchedulerEntry }) => (
    <Tooltip
        content={scheduledTooltip(scheduled)}
        trigger={<Tag variant={"warning"} icon={<ScheduledIcon />} content={"Scheduled"} />}
    />
);

const LiveTag = ({ version }: { version: number }) => (
    <Tag swatchColor={"#5AC84C"} variant={"success-light"} content={`Live (v${version})`} />
);

/**
 * A scheduled action is superseded by a direct publish/unpublish. The API cancels it, but that
 * happens asynchronously, so reconcile against the entry's current state to clear the badge
 * immediately instead of waiting for the backend cancellation to propagate:
 *
 * - Scheduled PUBLISH is moot once the latest revision is already live (`live.version === version`).
 *   It is NOT moot when an older revision is live and a newer one is queued (live.version < version)
 *   — that is the legitimate "live and scheduled" case.
 * - Scheduled UNPUBLISH is moot once nothing is live.
 */
const isScheduleMoot = (
    scheduled: SchedulerEntry,
    liveVersion: number | undefined,
    currentVersion: number | undefined
): boolean => {
    if (scheduled.actionType === ScheduleActionType.unpublish) {
        return liveVersion === undefined;
    }
    return liveVersion !== undefined && liveVersion === currentVersion;
};

/**
 * Overrides the CMS "Live" column cell to surface scheduled publish/unpublish actions.
 *
 * An entry can be live AND have a scheduled action (e.g. a new revision scheduled to publish), so
 * both are shown when both apply. Otherwise it falls back to the default "Live (vN)" / "No".
 */
export const CellLive = observer(() => {
    const { useTableRow, isFolderRow } = ContentEntryListConfig.Browser.Table.Column;
    const { row } = useTableRow();
    const { model } = useModel();
    const container = useContainer();

    const namespace = createNamespace(model);
    // Refetch whenever a schedule/cancel bumps the signal.
    const version = schedulerMutationSignal.version;

    useEffect(() => {
        const gateway = container.resolve(ListScheduledActionsGateway);
        scheduledActionsStore.load(gateway, namespace, version);
    }, [container, namespace, version]);

    // A direct publish/unpublish changes the entry's status/live and the API may auto-cancel a
    // scheduled action. Detect that change and bump the signal so the scheduled-actions cache is
    // refreshed (otherwise a cancelled schedule's badge lingers until a page reload).
    const rowData = row.data as { meta?: { status?: string }; live?: { version?: number } };
    const stateFingerprint = `${rowData?.meta?.status ?? ""}:${rowData?.live?.version ?? ""}`;
    const prevFingerprint = useRef(stateFingerprint);
    useEffect(() => {
        if (prevFingerprint.current !== stateFingerprint) {
            prevFingerprint.current = stateFingerprint;
            schedulerMutationSignal.bump();
        }
    }, [stateFingerprint]);

    if (isFolderRow(row)) {
        return <>{"-"}</>;
    }

    const entry = row.data;
    const liveVersion = entry.live?.version;

    const rawScheduled = scheduledActionsStore.getAction(namespace, entry.id);
    // Ignore a scheduled action the entry's current state has already made moot (see helper).
    const scheduled =
        rawScheduled && !isScheduleMoot(rawScheduled, liveVersion, entry.meta?.version)
            ? rawScheduled
            : undefined;

    // Live now AND a change scheduled — show both, wrapping to a second line if the column is narrow.
    if (liveVersion && scheduled) {
        return (
            <div className={"flex flex-wrap items-center gap-xs"}>
                <LiveTag version={liveVersion} />
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

    return <LiveTag version={liveVersion} />;
});
