import React from "react";
import { Alert, Button, EmptyState, Text } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import {
    defaultOpenRevisions,
    emptyFilteredHint,
    isRevisionOpen
} from "~/admin/timeline/revisionDisclosure.js";
import type { TimelineFilters, TimelineView } from "~/admin/hooks/buildTimelineView.js";
import { ActivityTimelineFilters } from "../ActivityTimelineFilters.js";
import { CoverageNotice } from "./CoverageNotice.js";
import { RevisionGroup } from "./RevisionGroup.js";

/** A value that changes exactly when the applied filters do, for comparing one render to the last. */
export const filterIdentity = (filters: TimelineFilters): string =>
    `${filters.revision ?? ""}|${filters.actorId ?? ""}`;

export interface ActivityTimelineViewProps {
    view: TimelineView;
    loading: boolean;
    loadingMore: boolean;
    refreshing: boolean;
    error: string | null;
    hasMore: boolean;
    filters: TimelineFilters;
    setFilters(filters: TimelineFilters): void;
    loadMore(): void;
    /** Whether the filter bar is showing. Owned by the panel, which also owns the button. */
    filtersOpen?: boolean;
}

/**
 * Presentation only, taking everything as props.
 *
 * Split from the connected component so every state can be rendered without a container, a
 * gateway or a network call — which is what makes the state acceptance tests executable rather
 * than a checklist someone reads.
 */
export const ActivityTimelineView = ({
    view,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    filters,
    setFilters,
    filtersOpen,
    loadMore
}: ActivityTimelineViewProps) => {
    /*
      Which revisions the reader has opened or closed by hand. Only those: everything absent falls
      back to `defaultOpenRevisions`, so a revision that appears on a refresh gets the default
      rather than whatever its neighbour happens to be set to.
    */
    const [openOverrides, setOpenOverrides] = React.useState<Record<string, boolean>>({});
    const defaults = defaultOpenRevisions(view.groups, view.filtersActive);

    /*
      Changing a filter drops those choices and starts from the defaults again.

      Without this, a revision closed before filtering stays closed after, and the reader asks for
      one person's changes and is shown a band saying the revision has six saves with none of them
      on screen. Adjusting state during render rather than in an effect is React's own pattern for
      this, and avoids rendering one frame with the stale set.
    */
    const [filterKey, setFilterKey] = React.useState(() => filterIdentity(filters));

    if (filterKey !== filterIdentity(filters)) {
        setFilterKey(filterIdentity(filters));
        setOpenOverrides({});
    }

    const toggleRevision = (revision: string) =>
        setOpenOverrides(current => ({
            ...current,
            [revision]: !isRevisionOpen(revision, current, defaults)
        }));

    if (loading) {
        return (
            <div className={"flex flex-col gap-sm p-sm-extra"}>
                <Skeleton className={"h-8"} />
                <Skeleton className={"h-16"} />
                <Skeleton className={"h-16"} />
            </div>
        );
    }

    if (error) {
        return (
            <Alert type={"danger"} variant={"subtle"} icon={null} className={"m-sm-extra"}>
                <Text size={"sm"}>{`Could not load activity: ${error}`}</Text>
            </Alert>
        );
    }

    return (
        <div className={"flex h-full min-h-0 flex-col"}>
            <ActivityTimelineFilters
                summary={view.summary}
                open={filtersOpen ?? false}
                revisions={view.revisions}
                actors={view.actors}
                filters={filters}
                onChange={setFilters}
            />

            <div className={"min-h-0 flex-1 overflow-y-auto"}>
                {/*
                  Announced rather than shown as a spinner, and above the rows rather than
                  replacing them. A save refreshes the timeline in place, and swapping the reader's
                  rows for a loading state on every save is what would make the refresh feel worse
                  than not having it.
                */}
                {refreshing ? (
                    <Text
                        as={"div"}
                        size={"sm"}
                        role={"status"}
                        className={"px-sm-extra py-xs text-neutral-muted"}
                    >
                        Updating…
                    </Text>
                ) : null}

                {/*
                  The two empty states are different statements and must not converge: nothing was
                  ever recorded, versus nothing matches what you asked for.
                */}
                {view.state.status === "empty-filtered" ? (
                    <EmptyState
                        size={"sm"}
                        type={"select"}
                        title={"No activity matches these filters"}
                        description={emptyFilteredHint(filtersOpen ?? false)}
                    />
                ) : null}

                {view.state.status === "empty-unrecorded" ? (
                    <EmptyState
                        size={"sm"}
                        type={"content"}
                        title={"No history for this entry"}
                        /*
                          States what is known and explains rather than asserts.

                          It used to say "It was last changed before activity was recorded" as a
                          fact about this entry. The panel cannot know that: all it has is zero
                          records, and the reasons for zero records include a capture that failed
                          silently — the recorder swallows its own errors by design, so that a
                          failure to record cannot fail a save. On that entry the old sentence was
                          simply untrue, and it was the confident half of the message.
                        */
                        description={
                            "We have no record of this entry's history — usually because it was last changed before activity was recorded. Nothing is missing here; there is simply nothing to show. Tracking starts with the next save."
                        }
                    />
                ) : null}

                {view.state.status === "populated" ? (
                    <>
                        <CoverageNotice coverage={view.state.coverage} />
                        {view.groups.map(group => (
                            <RevisionGroup
                                key={group.revision}
                                group={group}
                                open={isRevisionOpen(group.revision, openOverrides, defaults)}
                                onToggle={() => toggleRevision(group.revision)}
                            />
                        ))}
                        {hasMore ? (
                            <div
                                className={
                                    "flex flex-col items-center gap-xs border-t-sm border-neutral-dimmed p-sm-extra"
                                }
                            >
                                <Button
                                    variant={"secondary"}
                                    size={"sm"}
                                    disabled={loadingMore}
                                    onClick={loadMore}
                                    text={loadingMore ? "Loading…" : "Load older activity"}
                                />
                                <Text size={"sm"} className={"text-neutral-muted"}>
                                    Records are kept permanently.
                                </Text>
                            </div>
                        ) : null}
                    </>
                ) : null}
            </div>
        </div>
    );
};
