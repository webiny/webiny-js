import * as React from "react";
import { ReactComponent as BackIcon } from "@webiny/icons/chevron_left.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { cn, makeDecoratable } from "~/utils.js";
import { IconButton } from "~/Button/index.js";

interface SidePanelProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
    title: React.ReactNode;
    /** A 20px icon ahead of the title. */
    icon?: React.ReactElement;
    /** Shows a back button, for a panel that has drilled into one item. */
    onBack?: () => void;
    backLabel?: string;
    /** After the title: a small tertiary button and the few ghost icon buttons that matter. */
    headerEnd?: React.ReactNode;
    onClose?: () => void;
    closeLabel?: string;
    /** A fixed row under the header that does not scroll, such as a search field. */
    headerExtra?: React.ReactNode;
    width?: React.CSSProperties["width"];
    /** `SidePanelBody`, then an optional `SidePanelFooter`. */
    children: React.ReactNode;
}

/**
 * A panel docked beside the page that stays open while people keep working. Unlike a Drawer it has no
 * backdrop and does not trap focus: the page narrows to make room. Below 1024px it covers the page
 * instead, so the host has to be the positioned element the panel sits in.
 *
 * Esc closes it only while focus is inside it, since the page beside it is still in use.
 */
const SidePanelBase = ({
    title,
    icon,
    onBack,
    backLabel = "Back",
    headerEnd,
    onClose,
    closeLabel = "Close panel",
    headerExtra,
    width = 464,
    className,
    style,
    children,
    ...props
}: SidePanelProps) => {
    const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === "Escape" && onClose && !event.defaultPrevented) {
            event.preventDefault();
            onClose();
        }
    };

    return (
        <aside
            aria-label={typeof title === "string" ? title : undefined}
            onKeyDown={onKeyDown}
            className={cn(
                "flex h-full min-h-0 flex-none flex-col border-l-sm border-neutral-dimmed bg-neutral-base text-neutral-strong",
                "max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-overlay max-lg:shadow-lg",
                className
            )}
            style={{ width, ...style }}
            {...props}
        >
            <div
                className={cn(
                    "flex h-[56px] flex-none items-center gap-xs border-b-sm border-neutral-dimmed pr-sm",
                    onBack ? "pl-sm" : "pl-md"
                )}
            >
                {onBack ? (
                    <IconButton
                        variant={"ghost"}
                        size={"md"}
                        icon={<BackIcon />}
                        aria-label={backLabel}
                        onClick={onBack}
                    />
                ) : null}
                {icon ? <span className={"mr-xxs inline-flex"}>{icon}</span> : null}
                <h2 className={"m-0 min-w-0 flex-1 truncate text-h5 text-neutral-primary"}>
                    {title}
                </h2>
                {headerEnd}
                {onClose ? (
                    <IconButton
                        variant={"ghost"}
                        size={"md"}
                        icon={<CloseIcon />}
                        aria-label={closeLabel}
                        onClick={onClose}
                    />
                ) : null}
            </div>
            {headerExtra ? (
                <div className={"flex-none px-md pb-sm pt-md"}>{headerExtra}</div>
            ) : null}
            {children}
        </aside>
    );
};

const SidePanel = makeDecoratable("SidePanel", SidePanelBase);

export { SidePanel, type SidePanelProps };
