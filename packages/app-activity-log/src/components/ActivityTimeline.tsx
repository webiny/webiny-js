import React, { useState } from "react";
import { Button, Heading, Separator, Skeleton, Text } from "@webiny/admin-ui";
import { discloseItem, summariseItem } from "~/timeline/summariseItem.js";
import { parseVersion, type TimelineGroup } from "~/timeline/groupByRevision.js";
import type { TimelineItem } from "~/timeline/collapseConsecutive.js";
import type { TimelineCoverage } from "~/timeline/deriveTimelineState.js";
import { useActivityTimeline } from "~/hooks/useActivityTimeline.js";
import { ActivityTimelineFilters } from "./ActivityTimelineFilters.js";
import type { TimelineFilters, TimelineView } from "~/hooks/buildTimelineView.js";

/**
 * Plain presentation, deliberately.
 *
 * Every one of these components is expected to be replaced by the design handover. None of them
 * decides anything: grouping, collapsing, path rendering, state derivation and what an expanded
 * row discloses are all pure functions in `src/timeline/`, and this file only arranges what they
 * return. If a rule you are looking for seems to be missing here, that is why.
 */

export interface ActivityTimelineProps {
    targetType: string;
    targetId: string;
    modelId: string;
    /** Changes when the target is written, which refreshes the timeline in place. */
    writeToken?: string;
}

const formatTimestamp = (iso: string): string => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
};

/** Falls back to the raw action so an unrecognised one never renders as blank. */
const ACTION_LABELS: Record<string, string> = {
    "entry.create": "Created",
    "entry.update": "Saved",
    "entry.revision.create": "New revision",
    "entry.revision.delete": "Revision deleted",
    "entry.revision.describe": "Revision described",
    "entry.publish": "Published",
    "entry.unpublish": "Unpublished",
    "entry.republish": "Republished",
    "entry.move": "Moved",
    "entry.trash": "Moved to bin",
    "entry.restore": "Restored",
    "entry.delete": "Deleted",
    "review.submitted": "Submitted for review",
    "review.step.started": "Review step started",
    "review.step.approved": "Review step approved",
    "review.step.rejected": "Review step rejected",
    "review.step.takenOver": "Review step taken over",
    "review.cancelled": "Review cancelled",
    "review.approved": "Review approved",
    "review.rejected": "Review rejected",
    "review.deleted": "Review deleted"
};

const OPERATION_LABELS: Record<string, string> = {
    added: "added",
    removed: "removed",
    moved: "moved",
    replaced: "replaced"
};

/**
 * A plain notice rather than the design system's `Alert`.
 *
 * `Alert` renders an icon that does not resolve under jsdom, which made the state acceptance tests
 * unable to read the very statements they exist to check. Since the handover is restyling all of
 * this anyway, a plain element that reliably says the thing is worth more here than the right
 * component that intermittently does not.
 */
const Notice = ({ children }: { children: React.ReactNode }) => (
    <div className={"mb-sm p-sm border-solid border-sm border-neutral-dimmed rounded-md"}>
        <Text as={"div"} size={"sm"}>
            {children}
        </Text>
    </div>
);

const CoverageNotice = ({ coverage }: { coverage: TimelineCoverage }) => {
    if (coverage.kind === "complete") {
        return null;
    }

    return (
        <Notice>
            History before {formatTimestamp(coverage.recordedFrom)} was not recorded. Activity began
            being captured at that point.
        </Notice>
    );
};

const ItemRow = ({ item }: { item: TimelineItem }) => {
    const [expanded, setExpanded] = useState(false);
    const summary = summariseItem(item);
    const disclosure = expanded ? discloseItem(item) : null;

    return (
        <div className={"py-sm"}>
            <div className={"flex items-baseline gap-sm"}>
                <Text size={"sm"} className={"font-semibold"}>
                    {ACTION_LABELS[summary.action] ?? summary.action}
                    {summary.occurrences > 1 ? ` ×${summary.occurrences}` : ""}
                </Text>
                <Text size={"sm"} className={"text-neutral-strong"}>
                    {summary.actorRedacted ? "Someone" : summary.actorDisplayName}
                </Text>
                <Text size={"sm"} className={"text-neutral-strong"}>
                    {formatTimestamp(summary.latestTimestamp)}
                    {summary.spansTime
                        ? ` (from ${formatTimestamp(summary.earliestTimestamp)})`
                        : ""}
                </Text>
            </div>

            {summary.subjectLabel ? (
                <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                    Step: {summary.subjectLabel}
                    {summary.hasNote ? " — a note was left" : ""}
                </Text>
            ) : null}

            {summary.changedFieldCount > 0 ? (
                <Button
                    variant={"ghost"}
                    size={"sm"}
                    onClick={() => setExpanded(current => !current)}
                    text={
                        expanded
                            ? "Hide changed fields"
                            : `${summary.changedFieldCount} field${
                                  summary.changedFieldCount === 1 ? "" : "s"
                              } changed`
                    }
                />
            ) : null}

            {disclosure ? (
                <div className={"pl-md"}>
                    <ul>
                        {disclosure.changes.map(change => (
                            <li key={`${change.text}-${change.operation ?? ""}`}>
                                <Text size={"sm"}>
                                    {change.text}
                                    {change.position === undefined
                                        ? ""
                                        : ` (item ${change.position})`}
                                    {change.operation
                                        ? ` — ${OPERATION_LABELS[change.operation] ?? change.operation}`
                                        : ""}
                                </Text>
                            </li>
                        ))}
                    </ul>
                    {disclosure.truncated ? (
                        <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                            More fields changed than are listed here.
                        </Text>
                    ) : null}
                    <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                        Values are not recorded. Use version compare to see what changed.
                    </Text>
                </div>
            ) : null}
        </div>
    );
};

const RevisionGroup = ({ group }: { group: TimelineGroup }) => {
    const version = parseVersion(group.revision);

    return (
        <div className={"mb-md"}>
            <Heading level={6}>{version === null ? group.revision : `Revision ${version}`}</Heading>
            <Separator className={"my-xs"} />
            {group.items.map(item => (
                <ItemRow key={item.latest.id} item={item} />
            ))}
        </div>
    );
};

export interface ActivityTimelineViewProps {
    view: TimelineView;
    loading: boolean;
    loadingMore: boolean;
    refreshing: boolean;
    error: string | null;
    hasMore: boolean;
    filters: TimelineFilters;
    setFilters(filters: TimelineFilters): void;
    clearFilters(): void;
    loadMore(): void;
}

/**
 * Presentation only, taking everything as props.
 *
 * Split from the connected component so every state can be rendered without a container, a
 * gateway or a network call — which is what makes the eight states executable acceptance criteria
 * rather than a checklist someone reads. This is the component the design handover replaces; the
 * connector below is the part that stays.
 */
export const ActivityTimelineView = ({
    view,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    clearFilters,
    loadMore
}: ActivityTimelineViewProps) => {
    if (loading) {
        return <Skeleton className={"h-32"} />;
    }

    if (error) {
        return <Notice>Could not load activity: {error}</Notice>;
    }

    return (
        <div>
            {/*
              Announced rather than shown as a spinner, and above the rows rather than replacing
              them. A save refreshes the timeline in place, and swapping the reader's rows for a
              loading state on every save is the thing that would make the refresh feel worse than
              not having it.
            */}
            {refreshing ? (
                <Text as={"div"} size={"sm"} className={"text-neutral-strong"} role={"status"}>
                    Updating…
                </Text>
            ) : null}

            {/*
              The two states that get skipped when building against a populated instance. They are
              different statements: nothing has been recorded, versus nothing matches the filter.
            */}
            {view.state.status === "empty-filtered" ? (
                <Notice>
                    No activity matches these filters.{" "}
                    <Button
                        variant={"ghost"}
                        size={"sm"}
                        onClick={clearFilters}
                        text={"Clear filters"}
                    />
                </Notice>
            ) : null}

            {view.state.status === "empty-unrecorded" ? (
                <Notice>
                    We have no record of this entry&apos;s history. It was last changed before
                    activity was recorded, so nothing is missing — there is simply nothing to show.
                </Notice>
            ) : null}

            {view.state.status === "populated" ? (
                <>
                    <CoverageNotice coverage={view.state.coverage} />
                    {view.groups.map(group => (
                        <RevisionGroup key={group.revision} group={group} />
                    ))}
                    {hasMore ? (
                        <Button
                            variant={"secondary"}
                            size={"sm"}
                            disabled={loadingMore}
                            onClick={loadMore}
                            text={loadingMore ? "Loading…" : "Load older activity"}
                        />
                    ) : null}
                </>
            ) : null}
        </div>
    );
};

/**
 * The connected component: resolves the timeline for a target and hands it to the view.
 *
 * Deliberately holds no rendering of its own.
 */
export const ActivityTimeline = ({
    targetType,
    targetId,
    modelId,
    writeToken
}: ActivityTimelineProps) => {
    const timeline = useActivityTimeline({ targetType, targetId, modelId, writeToken });

    return (
        <>
            <ActivityTimelineFilters
                revisions={timeline.view.revisions}
                actors={timeline.view.actors}
                filters={timeline.filters}
                onChange={timeline.setFilters}
                onClear={timeline.clearFilters}
            />
            <ActivityTimelineView {...timeline} />
        </>
    );
};
