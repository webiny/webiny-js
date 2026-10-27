import React from "react";
import { cn, Icon, Tag, Text } from "@webiny/admin-ui";
import { ReactComponent as ChevronDownIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import type { TimelineViewGroup } from "~/admin/hooks/buildTimelineView.js";
import { TYPE } from "../typeScale.js";
import { SaveRow } from "./SaveRow.js";
import { STATUS_TAG_VARIANT } from "./statusTagVariant.js";

/**
 * One revision, and the saves under it.
 *
 * The band opens and closes the group. A whole-band target rather than a chevron the reader has to
 * hit: it is the full width of the panel, it is already the thing their eye lands on, and on a
 * history of twenty revisions the difference between a 383px target and a 16px one is the
 * difference between skimming and aiming.
 *
 * `keyboard_arrow_down` rotated 180° when open, because that is exactly what `Accordion.Item`
 * does on every save row inside this group — two disclosure controls one indent apart should not
 * disagree about which way the arrow points.
 *
 * Closed rows unmount rather than hide. The point of closing a revision is to be rid of it, and a
 * long history keeps the whole timeline's worth of accordions, tags and timestamps alive if they
 * are only `display:none`.
 */
export const RevisionGroup = ({
    group,
    open,
    onToggle
}: {
    group: TimelineViewGroup;
    open: boolean;
    onToggle(): void;
}) => {
    const panelId = `activity-revision-${group.revision}`;

    return (
        <div>
            {/*
              Sticky, so the revision stays named once its saves scroll past the top. On a long
              timeline it is the only thing keeping a reader oriented.

              The comments panel's tinted band, which is the closest thing it has to this: a strip
              of `neutral-subtle` under the header, carrying a semibold count on the left and
              quieter detail on the right. 16px of horizontal padding, matching it and the panel
              header, so the three bands and every row below share one left edge.
            */}
            <button
                type={"button"}
                onClick={onToggle}
                aria-expanded={open}
                aria-controls={panelId}
                className={
                    "sticky top-0 z-10 flex w-full cursor-pointer items-center gap-sm border-b-sm border-neutral-dimmed bg-neutral-subtle px-md py-sm-plus text-left hover:bg-neutral-light"
                }
            >
                <Icon
                    size={"sm"}
                    label={""}
                    icon={<ChevronDownIcon />}
                    className={cn("shrink-0 transition-transform", open ? "rotate-180" : undefined)}
                />
                {/*
                  Everything up to here holds its size; the meta is what gives.

                  The chevron costs 24px of a 351px band, which was enough to start wrapping the
                  widest case — a published current revision, two tags and a date range — so
                  "Revision 4" broke across two lines and the tags truncated to "dr…" and
                  "Curre…". Of the four, the counts are the one a reader can lose the tail of and
                  still use, so they are the one allowed to.
                */}
                <Text className={cn(TYPE.band, "shrink-0 font-semibold whitespace-nowrap")}>
                    {group.described.label}
                </Text>
                {group.status ? (
                    <Tag
                        className={"shrink-0"}
                        variant={STATUS_TAG_VARIANT[group.status] ?? "neutral-base-outline"}
                        content={group.status}
                    />
                ) : null}
                {group.isCurrent ? (
                    <Tag className={"shrink-0"} variant={"accent-light"} content={"Current"} />
                ) : null}
                {/*
                  The band already says how many saves and over what span, which is what makes a
                  shut revision legible: the reader can tell whether it is worth opening without
                  opening it.
                */}
                <Text className={cn(TYPE.meta, "ml-auto min-w-0 truncate text-neutral-muted")}>
                    {group.described.meta}
                </Text>
            </button>

            {/*
              No gap under the last row. Its bottom rule then lands on the next revision's header
              rather than four pixels above it, where it read as a line belonging to nothing — the
              revision above looked unfinished instead of closed.
            */}
            <div id={panelId}>
                {open
                    ? group.items.map(item => <SaveRow key={item.latest.id} item={item} />)
                    : null}
            </div>
        </div>
    );
};
