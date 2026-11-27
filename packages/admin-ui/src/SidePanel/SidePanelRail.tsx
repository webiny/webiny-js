import * as React from "react";
import { ReactComponent as LeftPanelIcon } from "@webiny/icons/left_panel_open.svg";
import { ReactComponent as RightPanelIcon } from "@webiny/icons/right_panel_open.svg";
import { cn } from "~/utils.js";
import { makeDecoratable } from "~/utils.js";
import { IconButton } from "~/Button/index.js";

interface SidePanelRailProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick"> {
    /** The collapsed panel's name, written down the rail. */
    label: string;
    /** The side of the page the panel is docked on. Picks the icon and the border's side. */
    side?: "left" | "right";
    onExpand: () => void;
    /** The button's accessible label. Default: "Open {label}". */
    expandLabel?: string;
    /**
     * Draws the border on the page side of the rail. Turn it off when the host already draws one
     * around both the open panel and the rail.
     */
    bordered?: boolean;
}

/**
 * A collapsed side panel: a 45px strip with a button that opens the panel and the panel's label
 * written down the strip. The whole strip opens the panel; the button is there for the keyboard.
 *
 * The button is centred 28px from the top, where `SidePanel` and the editors' panel headers have
 * their collapse button, so the button does not jump when the panel is toggled. The host finds it
 * with `[data-role="side-panel-rail-expand"]` to move focus to it after the panel collapses.
 */
const SidePanelRailBase = ({
    label,
    side = "left",
    onExpand,
    expandLabel,
    bordered = true,
    className,
    ...props
}: SidePanelRailProps) => {
    let icon = <LeftPanelIcon />;
    if (side === "right") {
        icon = <RightPanelIcon />;
    }

    return (
        <div
            data-role={"side-panel-rail"}
            onClick={onExpand}
            className={cn(
                "flex h-full w-[45px] flex-none cursor-pointer select-none flex-col items-center gap-md bg-neutral-base pt-sm",
                bordered && side === "left" && "border-r-sm border-r-neutral-dimmed",
                bordered && side === "right" && "border-l-sm border-l-neutral-dimmed",
                className
            )}
            {...props}
        >
            <div className={"flex h-[40px] items-center"}>
                <IconButton
                    variant={"ghost"}
                    size={"xs"}
                    icon={icon}
                    aria-label={expandLabel ?? `Open ${label}`}
                    title={expandLabel ?? `Open ${label}`}
                    data-role={"side-panel-rail-expand"}
                />
            </div>
            <span
                className={"text-sm font-semibold text-neutral-strong [writing-mode:vertical-rl]"}
            >
                {label}
            </span>
        </div>
    );
};

const SidePanelRail = makeDecoratable("SidePanelRail", SidePanelRailBase);

export { SidePanelRail, type SidePanelRailProps };
