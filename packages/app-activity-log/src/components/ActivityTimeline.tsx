import React from "react";
import { cn } from "@webiny/admin-ui";
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
    TimeAgo,
    Tooltip
} from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as AutoAwesomeIcon } from "@webiny/icons/auto_awesome.svg";
import { ReactComponent as CompareIcon } from "@webiny/icons/compare_arrows.svg";
import { ReactComponent as HistoryToggleOffIcon } from "@webiny/icons/history_toggle_off.svg";
import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";
import { ReactComponent as KeyIcon } from "@webiny/icons/key.svg";
import { ReactComponent as PersonIcon } from "@webiny/icons/person.svg";
import { ReactComponent as RemoveIcon } from "@webiny/icons/remove.svg";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/schedule.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { ReactComponent as SubdirectoryIcon } from "@webiny/icons/subdirectory_arrow_right.svg";
import { ReactComponent as SwapVertIcon } from "@webiny/icons/swap_vert.svg";
import { describeAction } from "~/timeline/describeAction.js";
import { describeActor, type MachineIcon } from "~/timeline/describeActor.js";
import type { DescribedChange } from "~/timeline/describeChange.js";
import type { TimelineCoverage } from "~/timeline/deriveTimelineState.js";
import {
    discloseItem,
    summariseItem,
    type DisclosedFieldGroup,
    type DisclosedRun,
    type DisclosedSave,
    type TimelineSentence
} from "~/timeline/summariseItem.js";
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

const MACHINE_ICONS: Record<MachineIcon, React.ReactElement> = {
    key: <KeyIcon />,
    task: <ScheduleIcon />,
    system: <SettingsIcon />
};

/**
 * Operation glyphs. Colour carries the meaning here — added, removed and moved are the three
 * structural outcomes a reader scans for — so each takes a semantic fill rather than a neutral.
 *
 * An ordinary edit has no entry and takes no glyph. It is the default, and a mark on every chip
 * would spend the reader's attention on the case that never needs it.
 */
const OPERATION_ICONS: Record<string, { icon: React.ReactElement; className: string }> = {
    added: { icon: <AddIcon />, className: "fill-success" },
    removed: { icon: <RemoveIcon />, className: "fill-destructive" },
    moved: { icon: <SwapVertIcon />, className: "fill-warning" },
    replaced: { icon: <SwapVertIcon />, className: "fill-warning" }
};

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

/**
 * The ledger's type sizes, taken from the design.
 *
 * The design system's scale is 12/14/16 and the design asks for 11, 12 and 13 — sizes that carry
 * this panel's hierarchy in one and two pixel steps. Stated as exact values rather than rounded to
 * the nearest token, and kept in one place so the ledger has one answer to "how big is this" rather
 * than a decision at every line. A smaller token in `admin-ui` would be the better home for them if
 * this panel stops being the only thing that needs them.
 */
const TYPE = {
    /** A sentence, of any of the three kinds. */
    sentence: "text-[13px]! leading-[19px]!",
    /** The row's own first line, and anything reading at its weight. */
    row: "text-[13px]! leading-[19px]!",
    /** Field names, the fields line, the disclosure note. */
    field: "text-[12px]! leading-[17px]!",
    /** Clocks, timestamps, counts — everything that orients rather than informs. */
    meta: "text-[11px]! leading-[16px]!"
};

/** Clock time alone, for a ledger column where the date is already established by the row. */
const formatClock = (iso: string, withSeconds = false): string => {
    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return iso;
    }

    return date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        ...(withSeconds ? { second: "2-digit" } : {})
    });
};

/**
 * One changed field, as a chip.
 *
 * A chip rather than a row, which is the change that makes a heavy save readable: five fields were
 * five lines each carrying an icon and a name, and are now one wrapping line. The operation keeps
 * its colour, because added, removed and moved are the three outcomes a reader scans for and they
 * are worth a glyph; an ordinary edit is the default and takes none.
 */
const FieldChip = ({ change }: { change: DescribedChange }) => {
    const operation = change.operation ?? "";
    const glyph = OPERATION_ICONS[operation];

    return (
        <Tag
            variant={"neutral-light"}
            content={
                <span className={"flex items-center gap-xxs"}>
                    {glyph ? (
                        <Icon
                            size={"sm"}
                            color={"inherit"}
                            className={glyph.className}
                            label={operation}
                            icon={glyph.icon}
                        />
                    ) : null}
                    <span>{change.label}</span>
                    {change.position === undefined ? null : (
                        <span className={"text-neutral-strong"}>{`· item ${change.position}`}</span>
                    )}
                </span>
            }
        />
    );
};

/**
 * The fields of one save that share a path, with the path said once above them.
 *
 * Field first, path second — the design's treatment B — and the path stated once rather than per
 * field. Four fields under the same variant used to state that variant four times, which was most
 * of what made this read as a form. Deep paths elide their middle and carry the depth beside them,
 * so shortening never hides how far down a change was; the whole path is on hover.
 */
const FieldGroup = ({ group }: { group: DisclosedFieldGroup }) => (
    <div className={"min-w-0"}>
        {group.path.length > 0 ? (
            <Tooltip
                content={group.fullPath}
                trigger={
                    <div className={"mb-xxs flex items-center gap-xxs text-neutral-strong"}>
                        <Icon
                            size={"sm"}
                            label={"inside"}
                            icon={<SubdirectoryIcon />}
                            className={"shrink-0 fill-neutral-strong"}
                        />
                        <Text className={cn(TYPE.field, "truncate")}>{group.pathLabel}</Text>
                        {group.depth === "" ? null : (
                            <Tag variant={"neutral-light"} content={group.depth} />
                        )}
                    </div>
                }
            />
        ) : null}
        <div className={"flex flex-wrap gap-xxs"}>
            {group.fields.map((change, index) => (
                <FieldChip
                    key={`${change.text}-${change.operation ?? ""}-${index}`}
                    change={change}
                />
            ))}
        </div>
    </div>
);

/** A summary that has not arrived yet, holding the line it will take. */
const PendingNote = () => (
    <div className={"flex items-center gap-xs"}>
        <Skeleton type={"text"} size={"xs"} className={"max-w-[170px]"} />
        <Text className={cn(TYPE.meta, "whitespace-nowrap text-neutral-strong")}>
            {"Summarising"}
        </Text>
    </div>
);

/**
 * What separates the three kinds of sentence, and the one thing on a row that is not text.
 *
 * Only a generated sentence takes it. That asymmetry is the whole signal: an exact record carries
 * no decoration, so there is nothing to interpret, and the one kind that can be wrong is the one a
 * reader's eye catches. Marking both would make the distinction invisible again, which is why the
 * mark is defined here and nowhere else.
 *
 * It trails the sentence rather than sitting in a gutter beside it. The design puts it in a 16px
 * gutter with the sentence indented 20px past the actor's name, and that indent read as wrong in
 * the running panel — every line under a name now begins at the name's own edge, so a row is one
 * left edge whatever kind of sentence it holds. Trailing is what keeps the mark without spending
 * an indent on the rows that have nothing to mark.
 */
const SummaryMark = ({ summary }: { summary: TimelineSentence | null }) =>
    summary?.generated ? (
        <Tooltip
            content={"Written by AI from the values that changed. It can be wrong."}
            trigger={
                <Icon
                    size={"sm"}
                    label={"AI-generated"}
                    icon={<AutoAwesomeIcon />}
                    className={"ml-xxs inline-block align-text-bottom fill-primary-default"}
                />
            }
        />
    ) : null;

/**
 * The sentence itself, one step back in weight for the third kind.
 *
 * That step is what tells a field-name description from an exact one without putting a label on
 * either: an exact record reads at full strength, and a restatement of the chips below it does not
 * need to.
 */
const SummaryLine = ({ summary }: { summary: TimelineSentence }) => (
    <Text
        as={"div"}
        className={cn(
            TYPE.sentence,
            "text-wrap-pretty",
            summary.kind === "fields" ? "text-neutral-strong" : "text-neutral-primary"
        )}
    >
        {summary.segments.map((segment, index) => {
            if (segment.kind === "field") {
                // A field name carries weight, because it is the thing a reader is scanning for.
                // No colour: it belongs to the sentence rather than standing outside it.
                return (
                    <span key={index} className={"font-semibold"}>
                        {segment.text}
                    </span>
                );
            }

            if (segment.kind === "value") {
                // Content, marked the way content is marked everywhere else in this panel — the
                // same treatment as a field chip — so a reader learns one thing once. Without it
                // "from Now I like the new description to Now I like the new description, it is
                // really great" has no visible seam.
                return (
                    <span
                        key={index}
                        className={
                            "mx-[1px] rounded-xs bg-neutral-light px-xxs text-neutral-primary"
                        }
                    >
                        {segment.text}
                    </span>
                );
            }

            return <React.Fragment key={index}>{segment.text}</React.Fragment>;
        })}
        <SummaryMark summary={summary} />
    </Text>
);

/**
 * One save in the ledger: its clock, then the fields it touched.
 *
 * No sentence of its own. The run above it carries the sentence — generated, exact, or naming the
 * fields — and repeating a description per save was most of what made five fields take five lines.
 */
const SaveLine = ({ save, showTime }: { save: DisclosedSave; showTime: boolean }) => (
    <div className={"flex items-baseline gap-xs"}>
        {showTime ? (
            <Text
                className={cn(
                    TYPE.meta,
                    "shrink-0 tabular-nums whitespace-nowrap text-neutral-disabled"
                )}
            >
                {formatClock(save.timestamp, true)}
            </Text>
        ) : null}
        <div className={"flex min-w-0 flex-1 flex-col gap-xxs"}>
            {save.groups.map((group, index) => (
                <FieldGroup key={`${group.fullPath}-${index}`} group={group} />
            ))}
        </div>
    </div>
);

/**
 * One run of the ledger: the time it happened, then what it did.
 *
 * The time column carries the nesting, which is what lets a run need no box and no indent. Four
 * levels — revision, row, run, save — were legible before only by nesting each inside the last, and
 * that is what made an expansion read as a form rather than as history.
 */
const RunLine = ({ run }: { run: DisclosedRun }) => (
    <div
        className={
            "grid grid-cols-[52px_1fr] gap-xs border-b-sm border-dashed border-neutral-dimmed py-sm last:border-b-none"
        }
    >
        <Text className={cn(TYPE.meta, "pt-xxs pr-xxs text-right tabular-nums text-neutral-muted")}>
            {formatClock(run.saves[run.saves.length - 1]?.timestamp ?? "")}
        </Text>
        {/*
          One column for the whole run: the sentence, the placeholder and every save's fields all
          begin at the same edge. They used to find it separately — a grid on the sentence, a
          hand-written pad on the saves — and measured eight pixels apart in the browser.
        */}
        <div className={"min-w-0 pl-xs"}>
            {run.summary ? <SummaryLine summary={run.summary} /> : null}
            {run.pending ? <PendingNote /> : null}
            <div className={"mt-xs flex flex-col gap-xs"}>
                {run.saves.map(save => (
                    <SaveLine key={save.id} save={save} showTime={run.showSaveTimes} />
                ))}
            </div>
        </div>
    </div>
);

/**
 * The boundary note, one quiet line until someone asks.
 *
 * It explains where values are and are not recorded, which a reader needs once and then never
 * again — so it sits closed at the foot of the expansion rather than occupying two permanent lines
 * above the history. No icon colour, no border, no warning treatment: it states a boundary of the
 * feature rather than flagging a risk.
 */
const DisclosureNote = ({ hasSentence }: { hasSentence: boolean }) => {
    const [open, setOpen] = React.useState(false);

    const text = hasSentence
        ? "The change list records field names, never values. A summary is written from the values and may quote them as they stood at the time of the change. Compare revisions to see values."
        : "The change list records field names, never values. Compare revisions to see values.";

    if (!open) {
        return (
            <button
                type={"button"}
                onClick={() => setOpen(true)}
                className={cn(
                    TYPE.field,
                    "mt-xs flex cursor-pointer items-center gap-xxs text-neutral-strong",
                    "hover:text-neutral-primary"
                )}
            >
                <Icon
                    size={"sm"}
                    label={"about this list"}
                    icon={<InfoIcon />}
                    className={"fill-neutral-strong"}
                />
                <span>What this list records</span>
            </button>
        );
    }

    return (
        <div
            className={"mt-xs flex items-start gap-xs rounded-md bg-neutral-light p-xs-plus"}
            onClick={() => setOpen(false)}
        >
            <Icon
                size={"sm"}
                label={"about this list"}
                icon={<InfoIcon />}
                className={"mt-xxs shrink-0 fill-neutral-strong"}
            />
            <Text as={"div"} className={cn(TYPE.field, "text-wrap-pretty text-neutral-primary")}>
                {text}
            </Text>
        </div>
    );
};

/**
 * What one row discloses when opened: its runs, newest first, as a ledger.
 *
 * No boxes and no indentation carrying the nesting — the time column does that. Four levels were
 * previously legible only by putting each inside the last, which is what made an expansion read as
 * a form rather than as a history.
 */
const SaveDisclosure = ({ item }: { item: TimelineItem }) => {
    const disclosure = discloseItem(item);

    return (
        // `AccordionContent` hardcodes `pl-xxl pr-xxl text-md` with no way to pass a class through
        // it, which insets the ledger from both edges and oversizes every line in it. The negative
        // margins cancel that padding so the expansion can set its own, and `text-sm` resets the
        // inherited size — the ledger's own sizes are set per line, not inherited from a slot.
        <div className={"-mx-xxl border-t-sm border-neutral-dimmed pt-xs pr-md pb-xs pl-md"}>
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
            <DisclosureNote hasSentence={disclosure.hasSentence} />
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
            image={undefined}
            className={"rounded-full text-sm"}
            fallback={
                <Avatar.Fallback className={"rounded-full"}>
                    {initials === "" ? "?" : initials}
                </Avatar.Fallback>
            }
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
        <div>
            <Accordion background={"transparent"}>
                <Accordion.Item
                    // The hover overlay belongs on a list of actions. This is a history, every row
                    // opens, and a wash moving under the cursor down a long timeline is motion
                    // without meaning.
                    className={"before:hidden hover:before:bg-transparent"}
                    interactive={expandable}
                    icon={
                        <ActorAvatar
                            kind={actor.kind}
                            initials={actor.initials}
                            machineIcon={actor.machineIcon}
                            name={actor.name}
                        />
                    }
                    // The action badge used to sit between the name and the sentence, which pushed
                    // the sentence right on the rows that had one — "Created" starting at a
                    // different x than "made 6 saves" directly above it. It also said the same
                    // thing twice: the badge read "Created" and the sentence beside it read
                    // "created this entry". The actor badge stays, because "API" is not in the
                    // sentence anywhere.
                    title={
                        <span className={cn(TYPE.row, "flex flex-wrap items-baseline gap-xs")}>
                            <span>{actor.name}</span>
                            {actor.badge ? (
                                <Tag variant={"neutral-light"} content={actor.badge} />
                            ) : null}
                        </span>
                    }
                    subtitle={<span className={TYPE.row}>{action.sentence}</span>}
                    description={
                        <>
                            {/*
                              Two shapes, and they have to sit together in a list without the
                              shorter one reading as unfinished. A row that is one run carries that
                              run's sentence; a row of several carries the fields it touched
                              instead. Both keep the same left edge and the same last line, so the
                              difference reads as quiet rather than as missing.
                            */}
                            {summary.summary ? <SummaryLine summary={summary.summary} /> : null}
                            {summary.summaryPending ? <PendingNote /> : null}
                            {!summary.summary && !summary.summaryPending && summary.fieldsLine ? (
                                <Text
                                    as={"div"}
                                    className={cn(
                                        TYPE.field,
                                        "text-wrap-pretty text-neutral-strong"
                                    )}
                                >
                                    {summary.fieldsLine}
                                </Text>
                            ) : null}
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
            "flex items-start gap-sm border-t-sm border-neutral-dimmed bg-neutral-light px-sm-extra py-xs"
        }
    >
        <Icon
            size={"sm"}
            label={"Compare"}
            icon={<CompareIcon />}
            className={"mt-xxs shrink-0 fill-neutral-strong"}
        />
        <div className={"min-w-0"}>
            <Text as={"div"} size={"sm"} className={"font-semibold"}>
                {`Compare revisions to see values as of ${group.described.label}.`}
            </Text>
            <Text as={"div"} size={"sm"} className={"text-neutral-muted"}>
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

        <div className={"pb-xs"}>
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
