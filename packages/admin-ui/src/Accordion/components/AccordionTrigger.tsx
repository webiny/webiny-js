import * as React from "react";
import { ReactComponent as KeyboardArrowDownIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { ReactComponent as LockIcon } from "@webiny/icons/lock.svg";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import { cn } from "~/utils.js";
import { useAccordionItemProps } from "./AccordionItem.js";
import { useAccordionProps } from "./AccordionPropsProvider.js";
import { AccordionItemAction } from "./AccordionItemAction.js";
import { Icon } from "~/Icon/index.js";
import { AccordionItemDragHandle } from "~/Accordion/components/AccordionItemDragHandle.js";

const OpenCloseIndicator = () => {
    return (
        <Icon
            size={"md"}
            className={"transition"}
            color={"neutral-strong"}
            data-role={"open-close-indicator"}
            label={"Open/close indicator"}
            icon={<KeyboardArrowDownIcon />}
        />
    );
};

const AccordionTrigger = () => {
    const {
        title,
        subtitle,
        description,
        colorMark,
        actions,
        icon,
        interactive = true,
        locked,
        draggable
    } = useAccordionItemProps();

    const accordionProps = useAccordionProps();
    const openClosedIndicatorPosition = accordionProps.openClosedIndicatorPosition || "right";
    // The following three attributes are required for the trigger to act as a button.
    // We can't use the default button element here because the content of the trigger
    // can also contain one or more buttons.
    const divAsButtonProps = React.useMemo<React.HTMLAttributes<HTMLDivElement>>(() => {
        return {
            role: "button",
            tabIndex: interactive ? 0 : -1, // Disable keyboard interaction if not interactive
            onKeyDown: e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.currentTarget.click();
                }
            }
        };
    }, [interactive]);

    return (
        <CollapsiblePrimitive.Trigger
            asChild
            onClick={e => !interactive && e.preventDefault()} // Prevent clicking if not interactive
        >
            <div
                {...divAsButtonProps}
                className={cn(
                    "group/trigger w-full flex items-center relative min-h-[62px]",
                    "focus-visible:outline-none focus-visible:border-none focus-visible:ring-sm focus-visible:ring-primary-dimmed",
                    "group-[.accordion-variant-container]:rounded-lg",
                    "[&[data-state=open]_[data-role=open-close-indicator]]:rotate-180 border-l-accent",
                    interactive ? "cursor-pointer" : "cursor-default"
                )}
            >
                {draggable ? <AccordionItemDragHandle /> : null}
                {colorMark && (
                    <div
                        style={{ backgroundColor: colorMark }}
                        className={"block w-[4px] h-[48px] rounded-sm ml-sm"}
                    />
                )}
                <div className={"w-full flex justify-between items-center px-md py-sm-extra"}>
                    {/* Left side: icon or indicator based on position */}
                    {openClosedIndicatorPosition === "left" ? (
                        <>
                            {interactive && !locked ? (
                                <div className={"mr-md"}>
                                    <OpenCloseIndicator />
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <>{icon ? <div className={"mr-md"}>{icon}</div> : null}</>
                    )}

                    {/* Center: title, subtitle, description */}
                    <div className={"flex flex-col gap-xxs flex-grow text-left"}>
                        <div className={"flex gap-xs"}>
                            <div className={"text-md font-semibold webiny_accordion-item-title"}>
                                {title}
                            </div>
                            {subtitle && (
                                <div className={"text-neutral-muted text-md"}>{subtitle}</div>
                            )}
                        </div>

                        <div className={"text-sm text-neutral-strong"}>{description}</div>
                    </div>

                    {/* Right side: actions and indicator (or locked icon) */}
                    {openClosedIndicatorPosition === "right" ? (
                        <div className={"flex gap-xs items-center"}>
                            {locked ? (
                                <Icon label="Locked" icon={<LockIcon />} color={"neutral-light"} />
                            ) : (
                                <>
                                    {actions}
                                    {/* No need to show the separator if there are no actions and the item is not interactive. */}
                                    {actions && interactive ? (
                                        <AccordionItemAction.Separator />
                                    ) : null}
                                    {interactive ? <OpenCloseIndicator /> : null}
                                </>
                            )}
                        </div>
                    ) : (
                        <div className={"flex gap-xs items-center"}>
                            {locked ? (
                                <Icon label="Locked" icon={<LockIcon />} color={"neutral-light"} />
                            ) : (
                                <>{actions}</>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </CollapsiblePrimitive.Trigger>
    );
};

export { AccordionTrigger };
