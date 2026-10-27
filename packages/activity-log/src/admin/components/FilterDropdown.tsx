import React from "react";
import { cn, DropdownMenu, Icon, IconButton } from "@webiny/admin-ui";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { ReactComponent as ChevronDownIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { TYPE } from "./typeScale.js";

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
export const FilterDropdown = ({
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
