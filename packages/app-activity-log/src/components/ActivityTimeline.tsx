import React, { useState } from "react";
import { Alert, Button, Heading, Select, Separator, Skeleton, Text } from "@webiny/admin-ui";
import { discloseItem, summariseItem } from "~/timeline/summariseItem.js";
import { parseVersion, type TimelineGroup } from "~/timeline/groupByRevision.js";
import type { TimelineItem } from "~/timeline/collapseConsecutive.js";
import type { TimelineCoverage } from "~/timeline/deriveTimelineState.js";
import { useActivityTimeline } from "~/hooks/useActivityTimeline.js";

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

const CoverageNotice = ({ coverage }: { coverage: TimelineCoverage }) => {
    if (coverage.kind === "complete") {
        return null;
    }

    return (
        <Alert type={"info"} className={"mb-sm"}>
            History before {formatTimestamp(coverage.recordedFrom)} was not recorded. Activity began
            being captured at that point.
        </Alert>
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

const Filters = ({
    revisions,
    actors,
    filters,
    onChange,
    onClear
}: {
    revisions: string[];
    actors: { id: string; displayName: string }[];
    filters: { revision?: string; actorId?: string };
    onChange(next: { revision?: string; actorId?: string }): void;
    onClear(): void;
}) => (
    <div className={"flex gap-sm items-end mb-sm"}>
        <Select
            label={"Revision"}
            value={filters.revision ?? ""}
            options={[
                { value: "", label: "All revisions" },
                ...revisions.map(revision => ({ value: revision, label: revision }))
            ]}
            onChange={(value: string) => onChange({ ...filters, revision: value || undefined })}
        />
        {actors.length > 0 ? (
            <Select
                label={"Person"}
                value={filters.actorId ?? ""}
                options={[
                    { value: "", label: "Anyone" },
                    ...actors.map(actor => ({ value: actor.id, label: actor.displayName }))
                ]}
                onChange={(value: string) => onChange({ ...filters, actorId: value || undefined })}
            />
        ) : null}
        {filters.revision || filters.actorId ? (
            <Button variant={"ghost"} size={"sm"} onClick={onClear} text={"Clear filters"} />
        ) : null}
    </div>
);

export const ActivityTimeline = ({ targetType, targetId, modelId }: ActivityTimelineProps) => {
    const {
        view,
        loading,
        loadingMore,
        error,
        hasMore,
        filters,
        setFilters,
        clearFilters,
        loadMore
    } = useActivityTimeline({ targetType, targetId, modelId });

    if (loading) {
        return <Skeleton className={"h-32"} />;
    }

    if (error) {
        return <Alert type={"danger"}>Could not load activity: {error}</Alert>;
    }

    return (
        <div>
            <Filters
                revisions={view.revisions}
                actors={view.actors}
                filters={filters}
                onChange={setFilters}
                onClear={clearFilters}
            />

            {/*
              The two states that get skipped when building against a populated instance. They are
              different statements: nothing has been recorded, versus nothing matches the filter.
            */}
            {view.state.status === "empty-filtered" ? (
                <Alert type={"info"}>
                    No activity matches these filters.{" "}
                    <Button
                        variant={"ghost"}
                        size={"sm"}
                        onClick={clearFilters}
                        text={"Clear filters"}
                    />
                </Alert>
            ) : null}

            {view.state.status === "empty-unrecorded" ? (
                <Alert type={"info"}>
                    We have no record of this entry&apos;s history. It was last changed before
                    activity was recorded, so nothing is missing — there is simply nothing to show.
                </Alert>
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
