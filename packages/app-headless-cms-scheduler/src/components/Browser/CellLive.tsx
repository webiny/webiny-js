import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useContainer } from "@webiny/app";
import { useModel } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { ListScheduledActionsGateway } from "@webiny/app-scheduler/features/listScheduledActions/abstractions.js";
import { createNamespace } from "~/utils/index.js";
import { scheduledActionsStore } from "./ScheduledActionsStore.js";
import { schedulerMutationSignal } from "../schedulerMutationSignal.js";
import { LiveTag } from "./LiveTag.js";
import { ScheduledTag } from "./ScheduledTag.js";
import { isScheduleMoot } from "./isScheduleMoot.js";

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
