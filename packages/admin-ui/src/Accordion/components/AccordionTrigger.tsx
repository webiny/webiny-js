import * as React from "react";
import { ReactComponent as KeyboardArrowDownIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import { cn } from "~/utils.js";
import { type AccordionItemProps } from "./AccordionItem.js";
import { AccordionItemAction } from "./AccordionItemAction.js";
import { Icon } from "~/Icon/index.js";
import { AccordionItemDragHandle } from "~/Accordion/components/AccordionItemDragHandle.js";

type AccordionTriggerProps = Pick<
    AccordionItemProps,
    "title" | "description" | "icon" | "handle" | "interactive" | "actions" | "draggable"
>;

const OpenCloseIndicator = () => {
    return (
        <Icon
            size={"lg"}
            className={"transition"}
            color={"neutral-strong"}
            data-role={"open-close-indicator"}
            label={"Open/close indicator"}
            icon={<KeyboardArrowDownIcon />}
        />
    );
};

const AccordionTrigger = ({
    title,
    description,
    actions,
    icon,
    interactive = true,
    draggable
}: AccordionTriggerProps) => {
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

    const baseClasses = "group/trigger w-full flex items-center relative";
    const focusClasses =
        "focus-visible:outline-none focus-visible:border-none focus-visible:ring-sm focus-visible:ring-primary-dimmed";
    const hoverClasses = "hover:bg-neutral-dimmed";
    const variantClasses = "group-[.accordion-variant-container]:rounded-lg";
    const stateClasses = "[&[data-state=open]_[data-role=open-close-indicator]]:rotate-180";
    const borderClasses = "border-l-accent";
    const cursorClass = interactive ? "cursor-pointer" : "cursor-default";

    return (
        <CollapsiblePrimitive.Trigger
            asChild
            onClick={e => !interactive && e.preventDefault()} // Prevent clicking if not interactive
        >
            <div
                {...divAsButtonProps}
                className={cn(
                    baseClasses,
                    focusClasses,
                    hoverClasses,
                    variantClasses,
                    stateClasses,
                    borderClasses,
                    cursorClass
                )}
            >
                {draggable ? <AccordionItemDragHandle /> : null}
                <div className={"w-full flex justify-between items-center px-md py-sm-extra"}>
                    {icon ? <div className={"mr-md"}>{icon}</div> : null}
                    <div className={"flex flex-col gap-xxs flex-grow text-left"}>
                        <div className={"text-md font-semibold webiny_accordion-item-title"}>
                            {title}
                        </div>
                        <div className={"text-sm text-neutral-strong"}>{description}</div>
                    </div>
                    <div className={"flex gap-xs items-center"}>
                        {actions}
                        {/* No need to show the separator if there are no actions and the item is not interactive. */}
                        {actions && interactive ? <AccordionItemAction.Separator /> : null}
                        {interactive ? <OpenCloseIndicator /> : null}
                    </div>
                </div>
            </div>
        </CollapsiblePrimitive.Trigger>
    );
};

export { AccordionTrigger };
