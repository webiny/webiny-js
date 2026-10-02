import React from "react";
import { cn, Button, DropdownMenu, Icon, IconButton, Text } from "@webiny/admin-ui";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { ReactComponent as ChevronDownIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { ReactComponent as FilterIcon } from "@webiny/icons/filter_list.svg";
import { ReactComponent as KeyIcon } from "@webiny/icons/key.svg";
import { ReactComponent as PersonIcon } from "@webiny/icons/person.svg";
import type {
    ActorOption,
    RevisionOption,
    TimelineFilters
} from "~/admin/hooks/buildTimelineView.js";

/**
 * Filtering, in the two places the design puts it.
 *
 * A button in the panel's chrome opens a bar of two dropdowns — one revision, one actor — and the
 * summary line beneath them carries the arithmetic. Picking applies immediately and closes the
 * menu; the cross on a set dropdown clears that one filter and nothing else.
 *
 * The options are the entry's own history rather than a fixed list: only revisions and people that
 * actually produced rows are offered, each with how many, so a reader choosing between them can
 * see where the history is before narrowing to it.
 */

/** The ledger's type sizes, which the design carries into the filter bar unchanged. */
const TYPE = {
    control: "text-[13px]! leading-[19px]!",
    meta: "text-[11px]! leading-[16px]!"
};

export interface ActivityFilterToggleProps {
    open: boolean;
    /** How many filters are set, which the button carries so a shut bar still says so. */
    count: number;
    onToggle(): void;
}

/**
 * The control that opens the bar, and the only thing that says a filter is set while it is shut.
 *
 * It carries the count for that reason. A reader who collapses the bar and scrolls away would
 * otherwise have a narrowed timeline and nothing on screen admitting it.
 */
export const ActivityFilterToggle = ({ open, count, onToggle }: ActivityFilterToggleProps) => (
    <Button
        variant={"ghost"}
        size={"sm"}
        onClick={onToggle}
        aria-label={"Filter activity"}
        aria-expanded={open}
        icon={<FilterIcon />}
        text={count > 0 ? String(count) : undefined}
        // Tinted rather than solid: `primary` is the Save button's weight and this is a view
        // control. tailwind-merge replaces ghost's own background and fill, so no `!` is needed.
        className={cn(open || count > 0 ? "bg-primary-subtle fill-primary-default" : undefined)}
    />
);

interface DropdownOption {
    key: string;
    label: string;
    /** A machine or a person, on the actor dropdown. Nothing on the revision dropdown. */
    icon?: React.ReactElement;
    /** The revision's publishing status, where it is known. */
    tag?: string | null;
    count: number;
    selected: boolean;
    onSelect(): void;
}

/**
 * One filter: a bordered control naming the current value, and a menu of what else this entry's
 * history offers.
 *
 * The clear cross is a sibling of the trigger rather than a child of it, positioned over the
 * control. Drawn as one box, it is two actions — open the menu, and clear this filter — and a
 * button inside a button is neither valid markup nor reachable by keyboard.
 */
const FilterDropdown = ({
    label,
    allLabel,
    set,
    options,
    footer,
    onClear,
    clearLabel
}: {
    label: string;
    allLabel: string;
    set: boolean;
    options: DropdownOption[];
    footer: string;
    onClear(): void;
    clearLabel: string;
}) => (
    /*
      The box carries the border, the height and the order; the trigger inside it carries only the
      label. That is what lets the design's arrangement — label, clear, chevron — exist without a
      button inside a button: the chevron is decoration and sits outside the trigger, and the clear
      cross is its own control beside it.

      `DropdownMenu` also wraps its trigger in an inline-block div of its own, which shrinks to its
      content, so a trigger that should fill the box has to be told to through that wrapper.
    */
    <div
        className={cn(
            "flex h-[30px] min-w-0 flex-1 items-center gap-xxs rounded-md border-sm bg-neutral-base pr-xs pl-xs",
            set ? "border-primary-muted" : "border-neutral-muted",
            "hover:border-neutral-strong",
            "[&>div]:min-w-0 [&>div]:flex-1"
        )}
    >
        <DropdownMenu
            trigger={
                <button
                    type={"button"}
                    className={cn(
                        TYPE.control,
                        "flex h-[28px] w-full min-w-0 cursor-pointer items-center text-left",
                        set ? "text-neutral-primary" : "text-neutral-strong"
                    )}
                >
                    <span className={"min-w-0 flex-1 truncate"}>{label}</span>
                </button>
            }
        >
            <DropdownMenu.Item
                text={<span className={TYPE.control}>{allLabel}</span>}
                onClick={onClear}
            />
            {options.map(option => (
                <DropdownMenu.Item
                    key={option.key}
                    icon={option.icon}
                    onClick={option.onSelect}
                    className={cn(option.selected ? "bg-primary-subtle" : undefined)}
                    text={
                        <span className={"flex min-w-0 items-center gap-xs-plus"}>
                            <span className={cn(TYPE.control, "min-w-0 flex-1 truncate")}>
                                {option.label}
                            </span>
                            {option.tag ? (
                                <span
                                    className={cn(
                                        TYPE.meta,
                                        "shrink-0 rounded-xs px-[5px]",
                                        // Live is the one status worth colouring, here for the
                                        // same reason as in the revision header.
                                        option.tag === "published"
                                            ? "bg-success-subtle text-neutral-primary"
                                            : "bg-neutral-light text-neutral-strong"
                                    )}
                                >
                                    {option.tag}
                                </span>
                            ) : null}
                            <span className={cn(TYPE.meta, "shrink-0 text-neutral-muted")}>
                                {`${option.count} ${option.count === 1 ? "row" : "rows"}`}
                            </span>
                        </span>
                    }
                />
            ))}
            {/*
              What the list is drawn from, said once at the foot of it. The options are the entry's
              own activity, so a reader expecting a revision that is not there needs to know the
              list is history rather than a catalogue of every revision.
            */}
            <DropdownMenu.Label
                className={cn(
                    TYPE.meta,
                    "mt-xxs border-t-sm border-neutral-dimmed bg-neutral-light px-sm-plus py-xs-plus font-normal normal-case text-neutral-strong"
                )}
                text={footer}
            />
        </DropdownMenu>

        {set ? (
            <IconButton
                size={"xxs"}
                variant={"ghost"}
                aria-label={clearLabel}
                icon={<CloseIcon />}
                onClick={onClear}
            />
        ) : null}
        <Icon size={"sm"} label={""} icon={<ChevronDownIcon />} className={"shrink-0"} />
    </div>
);

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

    return (
        <div
            className={
                "flex flex-col gap-sm border-b-sm border-neutral-dimmed bg-neutral-light px-sm-extra py-sm"
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
                /*
                  12/18 from the design rather than the scale's 12/16. It matters on a narrow panel,
                  where this line is the one thing here that wraps.
                */
                <Text size={"sm"} className={"leading-[18px]! text-neutral-strong"}>
                    {summary}
                </Text>
            )}
        </div>
    );
};
