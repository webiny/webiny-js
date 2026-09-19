import React from "react";
import { Button, IconButton, Popover, Select, Tag, Text } from "@webiny/admin-ui";
import { ReactComponent as FilterIcon } from "@webiny/icons/filter_list.svg";
import type { TimelineFilters } from "~/hooks/buildTimelineView.js";

/**
 * The summary line and the applied filter state.
 *
 * The design's point about filtering is that the *applied* state matters more than the controls:
 * a reader looking at a narrowed timeline needs to see what is being excluded and how to get
 * back, which is what the chips are. The controls themselves sit behind the filter button, where
 * they are out of the way of the thing being read.
 *
 * A chip is a `Tag` with `onDismiss`, so removing one filter is the obvious gesture and the
 * design system already owns the interaction. The decision about *which* filters can be offered is
 * not here — that is `buildTimelineView`, which derives the option sets and is unit-tested.
 */
export interface ActivityTimelineFiltersProps {
    /** One line saying what the reader is looking at. */
    summary: string;
    revisions: string[];
    actors: { id: string; displayName: string }[];
    filters: TimelineFilters;
    onChange(next: TimelineFilters): void;
    onClear(): void;
}

export const ActivityTimelineFilters = ({
    summary,
    revisions,
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
                "flex flex-col gap-xs border-b-sm border-neutral-dimmed bg-neutral-light px-sm-extra py-xs"
            }
        >
            <div className={"flex items-center gap-sm"}>
                {summary === "" ? (
                    <span />
                ) : (
                    <Text size={"sm"} className={"text-neutral-strong"}>
                        {summary}
                    </Text>
                )}
                <div className={"ml-auto"}>
                    <Popover
                        trigger={
                            <IconButton
                                variant={anyApplied ? "primary" : "ghost"}
                                size={"sm"}
                                aria-label={"Filter activity"}
                                icon={<FilterIcon />}
                            />
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
                                            label: revision
                                        }))
                                    ]}
                                    onChange={(value: string) =>
                                        onChange({ ...filters, revision: value || undefined })
                                    }
                                />
                                {/*
                              Not offered when every actor is redacted: a reader without actor
                              identity cannot filter by actor, and the API rejects the attempt.
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
                </div>
            </div>

            {anyApplied ? (
                <div className={"flex flex-wrap items-center gap-xs"}>
                    {filters.revision ? (
                        <Tag
                            variant={"accent-light"}
                            content={`Revision: ${filters.revision}`}
                            onDismiss={() => onChange({ ...filters, revision: undefined })}
                            dismissIconLabel={"Remove revision filter"}
                        />
                    ) : null}
                    {filters.actorId ? (
                        <Tag
                            variant={"accent-light"}
                            content={`Person: ${actorName}`}
                            onDismiss={() => onChange({ ...filters, actorId: undefined })}
                            dismissIconLabel={"Remove person filter"}
                        />
                    ) : null}
                    <Button variant={"ghost"} size={"sm"} onClick={onClear} text={"Clear all"} />
                </div>
            ) : null}
        </div>
    );
};
