import React from "react";
import { Button, IconButton, Popover, Select, Tag, Text } from "@webiny/admin-ui";
import { ReactComponent as FilterIcon } from "@webiny/icons/filter_list.svg";
import { parseVersion, revisionLabel } from "~/timeline/groupByRevision.js";
import type { TimelineFilters } from "~/hooks/buildTimelineView.js";

/**
 * Filtering, in the two places the design puts it.
 *
 * The controls sit in the panel's own chrome beside refresh and close, because they are something
 * the reader reaches for rather than something they read. What stays in the timeline is the
 * *applied* state: a line saying how much is hidden, and a chip per filter saying what is being
 * excluded. That is the design's actual point about filtering — a reader looking at a narrowed
 * timeline needs to see the narrowing and the way back, and neither is a control.
 *
 * A chip is a `Tag` with `onDismiss`, so removing one filter is the obvious gesture and the design
 * system owns the interaction. The decision about *which* filters can be offered is not here —
 * that is `buildTimelineView`, which derives the option sets and is unit-tested.
 */

interface FilterOptions {
    revisions: string[];
    actors: { id: string; displayName: string }[];
}

export interface ActivityFilterMenuProps extends FilterOptions {
    filters: TimelineFilters;
    onChange(next: TimelineFilters): void;
}

/**
 * The controls, behind one button in the panel header.
 *
 * Out of the way of the thing being read, which is where the design puts them — filter, refresh
 * and close as one group, none of them competing with the timeline itself.
 */
export const ActivityFilterMenu = ({
    revisions,
    actors,
    filters,
    onChange
}: ActivityFilterMenuProps) => {
    const anyApplied = Boolean(filters.revision) || Boolean(filters.actorId);

    return (
        <Popover
            align={"end"}
            trigger={
                /*
                  Wrapped in a span, which `Tooltip` in this design system does for the same
                  reason. `Popover` hands its trigger straight to Radix with `asChild`, and Radix
                  anchors the panel off a ref to a real DOM node. Every admin-ui component is
                  wrapped by `makeDecoratable`, a plain function component, so that ref is dropped
                  and the panel opens at the viewport origin — measured at left 0, top -340: open,
                  populated and entirely off screen. The "Function components cannot be given refs"
                  warning in the console is reporting exactly this.
                */
                <span className={"inline-block leading-none"}>
                    <IconButton
                        variant={anyApplied ? "primary" : "ghost"}
                        size={"sm"}
                        aria-label={"Filter activity"}
                        icon={<FilterIcon />}
                    />
                </span>
            }
            content={
                <div className={"flex min-w-[220px] flex-col gap-sm p-sm"}>
                    <Select
                        label={"Revision"}
                        value={filters.revision ?? ""}
                        options={[
                            { value: "", label: "All revisions" },
                            ...revisions.map(revision => ({
                                value: revision,
                                label: revisionLabel(revision)
                            }))
                        ]}
                        onChange={(value: string) =>
                            onChange({ ...filters, revision: value || undefined })
                        }
                    />
                    {/*
                      Not offered when every actor is redacted: a reader without actor identity
                      cannot filter by actor, and the API rejects the attempt.
                    */}
                    {actors.length > 0 ? (
                        <Select
                            label={"Person"}
                            value={filters.actorId ?? ""}
                            options={[
                                { value: "", label: "Anyone" },
                                ...actors.map(actor => ({
                                    value: actor.id,
                                    label: actor.displayName
                                }))
                            ]}
                            onChange={(value: string) =>
                                onChange({ ...filters, actorId: value || undefined })
                            }
                        />
                    ) : null}
                </div>
            }
        />
    );
};

/**
 * One applied filter.
 *
 * Two-toned on purpose: which field is being filtered reads quietly, and the value it is pinned to
 * reads at full strength. A chip saying "Revision v2" where both words carry the same weight makes
 * the reader parse it; this way the value is what they see.
 */
const FilterChip = ({
    kind,
    value,
    onRemove,
    removeLabel
}: {
    kind: string;
    value: string;
    onRemove(): void;
    removeLabel: string;
}) => (
    <Tag
        variant={"accent-light"}
        content={
            <span className={"flex items-baseline gap-xxs"}>
                <span className={"font-normal text-neutral-strong"}>{kind}</span>
                <span className={"font-semibold"}>{value}</span>
            </span>
        }
        onDismiss={onRemove}
        dismissIconLabel={removeLabel}
    />
);

export interface ActivityTimelineFiltersProps {
    /** One line saying what the reader is looking at. */
    summary: string;
    actors: { id: string; displayName: string }[];
    filters: TimelineFilters;
    onChange(next: TimelineFilters): void;
    onClear(): void;
}

export const ActivityTimelineFilters = ({
    summary,
    actors,
    filters,
    onChange,
    onClear
}: ActivityTimelineFiltersProps) => {
    const actorName =
        actors.find(actor => actor.id === filters.actorId)?.displayName ?? filters.actorId;
    const anyApplied = Boolean(filters.revision) || Boolean(filters.actorId);

    return (
        <div
            className={
                "flex flex-col gap-sm border-b-sm border-neutral-dimmed bg-neutral-light px-sm-extra py-sm"
            }
        >
            {summary === "" ? null : (
                /*
                  12/18 from the design rather than the scale's 12/16. It matters on a narrow panel,
                  where this line is the one thing here that wraps.
                */
                <Text size={"sm"} className={"leading-[18px]! text-neutral-strong"}>
                    {summary}
                </Text>
            )}

            {anyApplied ? (
                <div className={"flex flex-wrap items-center gap-xs-plus"}>
                    {filters.revision ? (
                        <FilterChip
                            kind={"Revision"}
                            /*
                              The version alone, because the kind beside it already says the word.
                              The design's own sample data has both halves saying "Revision" and
                              renders "Revision Revision 1"; split here instead, so the chip reads
                              the way the sticky header does.
                            */
                            value={String(parseVersion(filters.revision) ?? filters.revision)}
                            onRemove={() => onChange({ ...filters, revision: undefined })}
                            removeLabel={"Remove revision filter"}
                        />
                    ) : null}
                    {filters.actorId ? (
                        <FilterChip
                            kind={"Person"}
                            value={actorName ?? ""}
                            onRemove={() => onChange({ ...filters, actorId: undefined })}
                            removeLabel={"Remove person filter"}
                        />
                    ) : null}
                    {/*
                      Quiet on purpose: it is the way back from a narrowed timeline, not a third
                      filter, and giving it a button's weight would put it in competition with the
                      chips it undoes.

                      The design draws it as an underlined link. `Button` sets `no-underline!`
                      deliberately and `Link` takes a navigation target, which clearing a filter is
                      not — so a ghost button at the chips' own size is as close as the design
                      system goes without overriding one of its own decisions.
                    */}
                    <Button
                        variant={"ghost"}
                        size={"sm"}
                        onClick={onClear}
                        text={"Clear"}
                        className={"h-auto px-xxs py-0"}
                    />
                </div>
            ) : null}
        </div>
    );
};
