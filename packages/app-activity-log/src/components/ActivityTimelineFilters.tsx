import React from "react";
import { Button, Select } from "@webiny/admin-ui";
import type { TimelineFilters } from "~/hooks/buildTimelineView.js";

/**
 * The filter row.
 *
 * Its own component because it is the one piece built on the design system's `Select`, which is
 * Radix-based and has no rendering precedent in this repo's jsdom tests. Keeping it separate lets
 * the state acceptance tests render the timeline itself without fighting a dropdown, and lets the
 * design handover replace the filter controls independently of the timeline.
 *
 * The decision about *which* filters to offer is not here — that is `buildTimelineView`, which
 * derives the revision and actor option sets and is unit-tested.
 */
export interface ActivityTimelineFiltersProps {
    revisions: string[];
    actors: { id: string; displayName: string }[];
    filters: TimelineFilters;
    onChange(next: TimelineFilters): void;
    onClear(): void;
}

export const ActivityTimelineFilters = ({
    revisions,
    actors,
    filters,
    onChange,
    onClear
}: ActivityTimelineFiltersProps) => (
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
