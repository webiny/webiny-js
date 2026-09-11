import React from "react";
import {
    Accordion,
    Alert,
    Avatar,
    Button,
    EmptyState,
    Icon,
    Skeleton,
    Tag,
    Text,
    TimeAgo
} from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as CompareIcon } from "@webiny/icons/compare_arrows.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as HistoryToggleOffIcon } from "@webiny/icons/history_toggle_off.svg";
import { ReactComponent as KeyIcon } from "@webiny/icons/key.svg";
import { ReactComponent as PersonIcon } from "@webiny/icons/person.svg";
import { ReactComponent as RemoveIcon } from "@webiny/icons/remove.svg";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/schedule.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { ReactComponent as SwapVertIcon } from "@webiny/icons/swap_vert.svg";
import { describeAction, type ActionBadgeTone } from "~/timeline/describeAction.js";
import { describeActor, type MachineIcon } from "~/timeline/describeActor.js";
import type { DescribedChange } from "~/timeline/describeChange.js";
import type { TimelineCoverage } from "~/timeline/deriveTimelineState.js";
import { discloseItem, summariseItem } from "~/timeline/summariseItem.js";
import type { TimelineItem } from "~/timeline/collapseConsecutive.js";
import { useActivityTimeline } from "~/hooks/useActivityTimeline.js";
import type {
    TimelineFilters,
    TimelineView,
    TimelineViewGroup
} from "~/hooks/buildTimelineView.js";
import { ActivityTimelineFilters } from "./ActivityTimelineFilters.js";

/**
 * The timeline, arranged.
 *
 * Every decision about *what* a row says lives in `src/timeline/` as a pure function:
 * `describeAction` builds the sentence, `describeActor` decides whether a person was present,
 * `describeChange` splits a path into a field and its containers, `describeGroup` writes the
 * revision header. This file only arranges what they return, and reaches for a design-system
 * component wherever one exists — `Accordion.Item` is the expandable save, `Avatar` the actor,
 * `Tag` every badge, `Alert` every notice, `EmptyState` both empty states, `TimeAgo` the relative
 * time.
 *
 * Two things are hand-rolled, both deliberately: the timeline rail (a left border with a dot per
 * row) and the sticky revision header. Neither has an equivalent in the design system, and
 * together they are what makes the revision-to-saves relationship readable — which is the hardest
 * requirement in the design, since one revision routinely holds many saves by several people.
 */

const TONE_TO_TAG_VARIANT: Record<
    ActionBadgeTone,
    "success" | "warning" | "destructive" | "neutral-light"
> = {
    success: "success",
    warning: "warning",
    destructive: "destructive",
    neutral: "neutral-light"
};

const MACHINE_ICONS: Record<MachineIcon, React.ReactElement> = {
    key: <KeyIcon />,
    task: <ScheduleIcon />,
    system: <SettingsIcon />
};

/**
 * Operation glyphs. Colour carries the meaning here — added, removed and moved are the three
 * structural outcomes a reader scans for — so each takes a semantic fill rather than a neutral.
 */
const OPERATION_ICONS: Record<string, { icon: React.ReactElement; className: string }> = {
    added: { icon: <AddIcon />, className: "fill-success" },
    removed: { icon: <RemoveIcon />, className: "fill-destructive" },
    moved: { icon: <SwapVertIcon />, className: "fill-warning" },
    replaced: { icon: <SwapVertIcon />, className: "fill-warning" }
};

const EDIT_GLYPH = { icon: <EditIcon />, className: "fill-neutral-strong" };

const formatTimestamp = (iso: string): string => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
};

const isValidTimestamp = (iso: string): boolean => !Number.isNaN(new Date(iso).getTime());

/** Absolute first, relative second — "when exactly" and "how long ago" are different questions. */
const RowTime = ({ timestamp }: { timestamp: string }) => (
    <span>
        {formatTimestamp(timestamp)}
        {isValidTimestamp(timestamp) ? (
            <>
                {" · "}
                <TimeAgo datetime={timestamp} />
            </>
        ) : null}
    </span>
);

/**
 * The second line that says what actually ran, when something acted on a person's behalf.
 *
 * Visually quiet on purpose: it qualifies the row above rather than competing with it. The
 * reader's question is "was someone actually sitting there", and this answers it without
 * displacing the name of the person accountable for the change.
 */
const ViaNote = ({ text }: { text: string }) => (
    <Alert
        type={"info"}
        variant={"subtle"}
        icon={<PersonIcon />}
        className={"mt-xs px-xs-plus py-xs"}
    >
        <Text size={"sm"}>{text}</Text>
    </Alert>
);

/** One changed field: what it was, where it lives, and what happened to it. */
const ChangeRow = ({ change }: { change: DescribedChange }) => {
    const operation = change.operation ?? "";
    const glyph = OPERATION_ICONS[operation] ?? EDIT_GLYPH;

    return (
        <div
            className={
                "flex items-start gap-sm border-b-sm border-neutral-dimmed px-sm-extra py-xs last:border-b-none"
            }
        >
            <Icon
                size={"sm"}
                color={"inherit"}
                className={`mt-xxs ${glyph.className}`}
                label={operation === "" ? "Edited" : operation}
                icon={glyph.icon}
            />
            <div className={"min-w-0"}>
                {/*
                  Field first, path second — the design's treatment B. The changed thing is what a
                  reader is looking for; the containers are how they place it. A full inline path
                  is precise and scans terribly, which is the whole reason for the split.
                */}
                <Text as={"div"} size={"md"} className={"font-semibold"}>
                    {change.label}
                    {change.position === undefined ? null : (
                        <Text size={"sm"} className={"font-normal text-neutral-muted"}>
                            {` · item ${change.position}`}
                        </Text>
                    )}
                    {operation === "" ? null : (
                        <Text size={"sm"} className={"font-normal text-neutral-strong"}>
                            {` ${operation}`}
                        </Text>
                    )}
                </Text>
                {change.ancestors.length > 0 ? (
                    <div className={"mt-xxs flex flex-wrap items-center gap-xxs"}>
                        {change.ancestors.map((ancestor, index) => (
                            <React.Fragment key={`${ancestor}-${index}`}>
                                <Text size={"sm"} className={"text-neutral-muted"}>
                                    {ancestor}
                                </Text>
                                {index < change.ancestors.length - 1 ? (
                                    <Text size={"sm"} className={"text-neutral-dimmed"}>
                                        {"›"}
                                    </Text>
                                ) : null}
                            </React.Fragment>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

/**
 * What one save discloses when opened.
 *
 * The closing line is not a disclaimer bolted on. "No values, ever" is the feature's defining
 * constraint, and an expanded save that simply stopped after the field list would read as though
 * the values had failed to load. Saying it out loud every time costs a line; a reader concluding
 * the panel is broken costs more.
 */
const SaveDisclosure = ({ item }: { item: TimelineItem }) => {
    const disclosure = discloseItem(item);

    return (
        <div
            className={
                "m-sm-extra overflow-hidden rounded-md border-sm border-neutral-dimmed bg-neutral-light"
            }
        >
            <div className={"flex flex-col"}>
                {disclosure.changes.map((change, index) => (
                    <ChangeRow
                        key={`${change.text}-${change.operation ?? ""}-${index}`}
                        change={change}
                    />
                ))}
            </div>
            {disclosure.truncated ? (
                <Alert type={"warning"} variant={"subtle"} icon={null} className={"m-xs"}>
                    <Text size={"sm"}>
                        More fields changed than are listed. The rest were rolled up to a common
                        parent.
                    </Text>
                </Alert>
            ) : null}
            <div className={"bg-neutral-base px-sm-extra py-xs"}>
                <Text as={"div"} size={"sm"} className={"text-neutral-muted"}>
                    Values from this save are not recorded. Compare revisions to see values.
                </Text>
            </div>
        </div>
    );
};

/** Initials for a person, a glyph for a machine, and neither for an actor the reader may not see. */
const ActorAvatar = ({
    kind,
    initials,
    machineIcon,
    name
}: {
    kind: "person" | "machine" | "redacted";
    initials: string;
    machineIcon: MachineIcon | null;
    name: string;
}) => {
    if (kind === "machine" && machineIcon) {
        return (
            <Avatar
                size={"sm"}
                variant={"light"}
                fallback={
                    <Avatar.Fallback>
                        <Icon size={"sm"} label={name} icon={MACHINE_ICONS[machineIcon]} />
                    </Avatar.Fallback>
                }
            />
        );
    }

    return (
        <Avatar
            size={"sm"}
            variant={kind === "redacted" ? "light" : "strong"}
            fallback={<Avatar.Fallback>{initials === "" ? "?" : initials}</Avatar.Fallback>}
        />
    );
};

/** One save, collapsed to a sentence and openable to its fields. */
const SaveRow = ({ item }: { item: TimelineItem }) => {
    const summary = summariseItem(item);
    const action = describeAction(item);
    const actor = describeActor({ actor: item.latest.actor, source: item.latest.source });
    const expandable = summary.changedFieldCount > 0;

    return (
        <div className={"relative ml-xs border-l-sm border-neutral-dimmed pl-md"}>
            {/*
              The rail dot, positioned over the group's left border so a run of saves reads as one
              thread under its revision.
            */}
            <span
                aria-hidden={"true"}
                className={
                    "absolute -left-[5px] top-lg size-xs rounded-full bg-neutral-strong ring-2 ring-neutral-base"
                }
            />
            <Accordion background={"transparent"}>
                <Accordion.Item
                    interactive={expandable}
                    icon={
                        <ActorAvatar
                            kind={actor.kind}
                            initials={actor.initials}
                            machineIcon={actor.machineIcon}
                            name={actor.name}
                        />
                    }
                    title={
                        <span className={"flex flex-wrap items-baseline gap-xs"}>
                            <span>{actor.name}</span>
                            {actor.badge ? (
                                <Tag variant={"neutral-light"} content={actor.badge} />
                            ) : null}
                            {action.badge ? (
                                <Tag
                                    variant={TONE_TO_TAG_VARIANT[action.badge.tone]}
                                    content={action.badge.label}
                                />
                            ) : null}
                        </span>
                    }
                    subtitle={action.sentence}
                    description={
                        <>
                            <RowTime timestamp={summary.latestTimestamp} />
                            {summary.spansTime ? (
                                <span>
                                    {` (from ${formatTimestamp(summary.earliestTimestamp)})`}
                                </span>
                            ) : null}
                            {summary.subjectLabel ? (
                                <div>
                                    {`Step: ${summary.subjectLabel}`}
                                    {summary.hasNote ? " — a note was left" : ""}
                                </div>
                            ) : null}
                            {actor.via ? <ViaNote text={actor.via} /> : null}
                        </>
                    }
                    actions={
                        expandable ? (
                            <Text size={"sm"} className={"whitespace-nowrap text-neutral-muted"}>
                                {`${summary.changedFieldCount} ${
                                    summary.changedFieldCount === 1 ? "field" : "fields"
                                }`}
                            </Text>
                        ) : undefined
                    }
                >
                    {expandable ? <SaveDisclosure item={item} /> : <span />}
                </Accordion.Item>
            </Accordion>
        </div>
    );
};

/**
 * Where compare belongs, and the honest limit on it.
 *
 * Compare works between revisions and can say nothing about the individual saves inside one, so
 * this sits at the boundary rather than on a row. The second line is the honesty problem the
 * design named: a reader looking at Tuesday's save wants to see Tuesday, and that state no longer
 * exists anywhere.
 */
const RevisionBoundary = ({ group }: { group: TimelineViewGroup }) => (
    <div
        className={
            "mt-xs ml-xs flex items-start gap-sm rounded-md border-sm border-neutral-dimmed bg-neutral-base p-sm-extra"
        }
    >
        <Icon size={"sm"} color={"neutral-light"} label={"Compare"} icon={<CompareIcon />} />
        <div className={"min-w-0"}>
            <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                {`Compare revisions to see values as of ${group.described.label}.`}
            </Text>
            <Text as={"div"} size={"sm"} className={"mt-xxs text-neutral-muted"}>
                Individual saves inside a revision are not comparable — only the revision as a whole
                is.
            </Text>
        </div>
    </div>
);

const RevisionGroup = ({ group }: { group: TimelineViewGroup }) => (
    <div>
        {/*
          Sticky, so the revision stays named once its saves scroll past the top. On a long
          timeline it is the only thing keeping a reader oriented.
        */}
        <div
            className={
                "sticky top-0 z-10 flex items-center gap-sm border-b-sm border-neutral-dimmed bg-neutral-light px-sm-extra py-xs"
            }
        >
            <Text size={"md"} className={"font-semibold"}>
                {group.described.label}
            </Text>
            {group.status ? <Tag variant={"neutral-base-outline"} content={group.status} /> : null}
            {group.isCurrent ? <Tag variant={"accent-light"} content={"Current"} /> : null}
            <Text size={"sm"} className={"ml-auto whitespace-nowrap text-neutral-muted"}>
                {group.described.meta}
            </Text>
        </div>

        <div className={"px-sm-extra pb-sm"}>
            {group.described.who === "" ? null : (
                <Text as={"div"} size={"sm"} className={"pt-xs pl-lg text-neutral-muted"}>
                    {group.described.who}
                </Text>
            )}

            {group.items.map(item => (
                <SaveRow key={item.latest.id} item={item} />
            ))}

            <RevisionBoundary group={group} />
        </div>
    </div>
);

const CoverageNotice = ({ coverage }: { coverage: TimelineCoverage }) => {
    if (coverage.kind === "complete") {
        return null;
    }

    return (
        <Alert
            type={"info"}
            variant={"subtle"}
            icon={<HistoryToggleOffIcon />}
            className={"m-sm-extra"}
        >
            <Text size={"sm"}>
                {`History before ${formatTimestamp(
                    coverage.recordedFrom
                )} was not recorded. Activity began being captured at that point.`}
            </Text>
        </Alert>
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
    clearFilters,
    loadMore
}: ActivityTimelineViewProps) => {
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
                revisions={view.revisions}
                actors={view.actors}
                filters={filters}
                onChange={setFilters}
                onClear={clearFilters}
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
                        description={"Remove a filter to widen the timeline."}
                        actions={
                            <Button
                                variant={"secondary"}
                                onClick={clearFilters}
                                text={"Clear filters"}
                            />
                        }
                    />
                ) : null}

                {view.state.status === "empty-unrecorded" ? (
                    <EmptyState
                        size={"sm"}
                        type={"content"}
                        title={"No history for this entry"}
                        description={
                            "We have no record of this entry's history. It was last changed before activity was recorded, so nothing is missing — there is simply nothing to show. Tracking starts with the next save."
                        }
                    />
                ) : null}

                {view.state.status === "populated" ? (
                    <>
                        <CoverageNotice coverage={view.state.coverage} />
                        {view.groups.map(group => (
                            <RevisionGroup key={group.revision} group={group} />
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

export interface ActivityTimelineProps {
    targetType: string;
    targetId: string;
    modelId: string;
    /** Changes when the target is written, which refreshes the timeline in place. */
    writeToken?: string;
    /** The revision the form is showing, so its group can be marked current. */
    currentRevision?: string;
    /** The current revision's publishing status, which only the form knows. */
    currentStatus?: string | null;
}

/**
 * The connected component: resolves the timeline for a target and hands it to the view.
 *
 * Deliberately holds no rendering of its own.
 */
export const ActivityTimeline = ({
    targetType,
    targetId,
    modelId,
    writeToken,
    currentRevision,
    currentStatus
}: ActivityTimelineProps) => {
    const timeline = useActivityTimeline({
        targetType,
        targetId,
        modelId,
        writeToken,
        currentRevision,
        currentStatus
    });

    return <ActivityTimelineView {...timeline} />;
};
