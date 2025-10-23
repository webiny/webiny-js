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

    return (
        <CollapsiblePrimitive.Trigger
            asChild
            onClick={e => !interactive && e.preventDefault()} // Prevent clicking if not interactive
        >
            <div
                {...divAsButtonProps}
                className={cn(
                    "group/trigger w-full flex items-center cursor-pointer relative",
                    "focus-visible:outline-none focus-visible:border-none focus-visible:ring-sm focus-visible:ring-primary-dimmed",
                    "hover:bg-neutral-dimmed",
                    "group-[.accordion-variant-container]:rounded-lg",
                    "[&[data-state=open]_[data-role=open-close-indicator]]:rotate-180",
                    interactive ? "cursor-pointer" : "cursor-default"
                )}
            >
                {draggable ? <AccordionItemDragHandle /> : null}
                <div
                    className={
                        "w-full flex justify-between items-center px-md py-sm-extra"
                    }
                >
                    {icon && <div className={"mr-md"}>{icon}</div>}
                    <div
                        className={"flex flex-col gap-xxs grow text-left"}
                    >
                        <div
                            className={"text-md font-semibold webiny_accordion-item-title"}
                        >
                            {title}
                        </div>
                        <div className={"text-sm text-neutral-strong"}>{description}</div>
                    </div>
                    <div className={"flex gap-xs"}>
                        {actions}

                        {/* No need to show the separator if there are no actions and the item is not interactive. */}
                        {actions && interactive && <AccordionItemAction.Separator />}

                        {interactive && (
                            <Icon
                                size={"lg"}
                                className={"transition"}
                                color={"neutral-strong"}
                                data-role={"open-close-indicator"}
                                label={"Open/close indicator"}
                                icon={<KeyboardArrowDownIcon />}
                            />
                        )}
                    </div>
                </div>
            </div>
        </CollapsiblePrimitive.Trigger>
    );
};

export { AccordionTrigger };
