import React from "react";
import { cn, Text } from "@webiny/admin-ui";
import { ReactComponent as KeyIcon } from "@webiny/icons/key.svg";
import { ReactComponent as PersonIcon } from "@webiny/icons/person.svg";
import type {
    ActorOption,
    RevisionOption,
    TimelineFilters
} from "~/admin/hooks/buildTimelineView.js";
import { TYPE } from "./typeScale.js";
import { FilterDropdown } from "./FilterDropdown.js";

export interface ActivityTimelineFiltersProps {
    /** One line saying what the reader is looking at. */
    summary: string;
    /** True while the bar is open. The summary line shows either way. */
    open: boolean;
    revisions: RevisionOption[];
    actors: ActorOption[];
    filters: TimelineFilters;
    onChange(next: TimelineFilters): void;
}

export const ActivityTimelineFilters = ({
    summary,
    open,
    revisions,
    actors,
    filters,
    onChange
}: ActivityTimelineFiltersProps) => {
    const revision = revisions.find(option => option.revision === filters.revision);
    const actor = actors.find(option => option.id === filters.actorId);

    /*
      The comments panel's overview strip, which this is: `neutral-subtle` at `10px 16px`, under
      the header and above the list, saying in one line what the reader is looking at.
    */
    return (
        <div
            className={
                "flex flex-col gap-sm border-b-sm border-neutral-dimmed bg-neutral-subtle px-md py-sm-plus"
            }
        >
            {open ? (
                <div className={"flex items-center gap-sm"}>
                    <FilterDropdown
                        label={revision?.label ?? "All revisions"}
                        allLabel={"All revisions"}
                        set={Boolean(filters.revision)}
                        onClear={() => onChange({ ...filters, revision: undefined })}
                        clearLabel={"Clear revision filter"}
                        footer={`${revisions.length} ${
                            revisions.length === 1 ? "revision has" : "revisions have"
                        } recorded activity.`}
                        options={revisions.map(option => ({
                            key: option.revision,
                            label: option.label,
                            tag: option.status,
                            count: option.rows,
                            selected: option.revision === filters.revision,
                            onSelect: () => onChange({ ...filters, revision: option.revision })
                        }))}
                    />
                    {/*
                      Not offered when every actor is redacted: a reader without actor identity
                      cannot filter by actor, and the API rejects the attempt.
                    */}
                    {actors.length > 0 ? (
                        <FilterDropdown
                            label={actor?.displayName ?? "All actors"}
                            allLabel={"All actors"}
                            set={Boolean(filters.actorId)}
                            onClear={() => onChange({ ...filters, actorId: undefined })}
                            clearLabel={"Clear person filter"}
                            footer={`${actors.length} ${
                                actors.length === 1 ? "person or key has" : "people and keys have"
                            } touched this entry.`}
                            options={actors.map(option => ({
                                key: option.id,
                                label: option.displayName,
                                icon: option.isMachine ? <KeyIcon /> : <PersonIcon />,
                                count: option.rows,
                                selected: option.id === filters.actorId,
                                onSelect: () => onChange({ ...filters, actorId: option.id })
                            }))}
                        />
                    ) : null}
                </div>
            ) : null}

            {summary === "" ? null : (
                /* 13/20, which is what comments sets on the strip this one answers to. */
                <Text className={cn(TYPE.band, "text-neutral-strong")}>{summary}</Text>
            )}
        </div>
    );
};
