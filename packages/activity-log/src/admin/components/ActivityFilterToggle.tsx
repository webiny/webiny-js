import React from "react";
import { Button, cn } from "@webiny/admin-ui";
import { ReactComponent as FilterIcon } from "@webiny/icons/filter_list.svg";

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
        //
        // `h-6` because a small `Button` is 25px and a small `IconButton` — which the refresh and
        // close controls beside it are — is 24. One pixel is invisible on its own, but it sets the
        // header's height, and the comments header next door is 51px to this one's 52.
        className={cn(
            "h-6",
            open || count > 0 ? "bg-primary-subtle fill-primary-default" : undefined
        )}
    />
);
