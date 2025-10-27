import * as React from "react";
import { ReactComponent as KeyboardArrowDownIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";
import { cn } from "~/utils.js";
import { type AccordionItemProps } from "./AccordionItem.js";
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
            className={"wby-transition"}
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

    const isInteractable = Boolean(actions && interactive);

    const baseClasses = "wby-group/trigger wby-w-full wby-flex wby-items-center wby-relative";
    const focusClasses =
        "focus-visible:wby-outline-none focus-visible:wby-border-none focus-visible:wby-ring-sm focus-visible:wby-ring-primary-dimmed";
    const hoverClasses = "hover:wby-bg-neutral-dimmed";
    const variantClasses = "group-[.wby-accordion-variant-container]:wby-rounded-lg";
    const stateClasses = "[&[data-state=open]_[data-role=open-close-indicator]]:wby-rotate-180";
    const borderClasses = "wby-border-l-accent";
    const cursorClass = interactive ? "wby-cursor-pointer" : "wby-cursor-default";

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
                {!icon && !isInteractable && (
                    <div className={"wby-ml-sm wby-w-[20px] wby-h-[1px] wby-bg-neutral-strong"} />
                )}
                {draggable ? <AccordionItemDragHandle /> : null}
                {isInteractable ? <OpenCloseIndicator /> : null}

                <div
                    className={
                        "wby-w-full wby-flex wby-justify-between wby-items-center wby-px-md wby-py-sm-extra"
                    }
                >
                    {icon && <div className={"wby-mr-md"}>{icon}</div>}
                    <div
                        className={"wby-flex wby-flex-col wby-gap-xxs wby-flex-grow wby-text-left"}
                    >
                        <div
                            className={"wby-text-md wby-font-semibold webiny_accordion-item-title"}
                        >
                            {title}
                        </div>
                        <div className={"wby-text-sm wby-text-neutral-strong"}>{description}</div>
                    </div>
                    <div className={"wby-flex wby-gap-xs"}>
                        {actions}
                        {!isInteractable ? <OpenCloseIndicator /> : null}
                    </div>
                </div>
            </div>
        </CollapsiblePrimitive.Trigger>
    );
};

export { AccordionTrigger };
