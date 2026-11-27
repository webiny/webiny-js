import * as React from "react";
import { ReactComponent as LeftPanelIcon } from "@webiny/icons/left_panel_open.svg";
import { ReactComponent as RightPanelIcon } from "@webiny/icons/right_panel_open.svg";
import { cn } from "~/utils.js";
import { makeDecoratable } from "~/utils.js";
import { IconButton } from "~/Button/index.js";
import { Text } from "~/Text/index.js";

interface CollapsibleSidePanelHeaderProps extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "onClick"
> {
    /** The panel's name. */
    label: string;
    /** The side of the page the panel is docked on. Picks the icon. Default `"left"`. */
    side?: "left" | "right";
    onCollapse: () => void;
    /** The button's accessible label. Default: "Collapse {label}". */
    collapseLabel?: string;
}

/**
 * The label and collapse button at the top of a `CollapsibleSidePanel`. The button lines up with the
 * open button on the collapsed panel's `SidePanelRail`, so it stays put when the panel is toggled:
 * both centre it 28px from the top, where `SidePanel` has its close button. The whole row collapses
 * the panel, as the whole rail opens it; the button is there for the keyboard.
 */
const CollapsibleSidePanelHeaderBase = ({
    label,
    side = "left",
    onCollapse,
    collapseLabel,
    className,
    ...props
}: CollapsibleSidePanelHeaderProps) => {
    let icon = <RightPanelIcon />;
    if (side === "right") {
        icon = <LeftPanelIcon />;
    }

    return (
        <div
            onClick={onCollapse}
            className={cn(
                "flex h-[40px] flex-none cursor-pointer items-center justify-between select-none",
                className
            )}
            {...props}
        >
            <Text as="div" size={"sm"} className={"font-semibold text-neutral-primary"}>
                {label}
            </Text>
            <IconButton
                variant={"ghost"}
                size={"xs"}
                icon={icon}
                aria-label={collapseLabel ?? `Collapse ${label}`}
                title={collapseLabel ?? `Collapse ${label}`}
                data-role={"collapsible-side-panel-collapse"}
            />
        </div>
    );
};

const CollapsibleSidePanelHeader = makeDecoratable(
    "CollapsibleSidePanelHeader",
    CollapsibleSidePanelHeaderBase
);

export { CollapsibleSidePanelHeader, type CollapsibleSidePanelHeaderProps };
