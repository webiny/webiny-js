import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { IconButton } from "~/components/Button";

import { cn } from "~/lib";
import { AccordionDivider } from "~/components";
import { ReactComponent as ArrowDown } from "@material-design-icons/svg/outlined/keyboard_arrow_up.svg";

type AccordionTriggerProps = React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
    /**
     * Actions to show on the right side of the accordion item
     */
    actions?: React.ReactElement | null;
    /**
     * Left side icon
     */
    icon?: React.ReactElement | null;

    /**
     * Accordion title
     */
    title?: React.ReactNode;

    /**
     * Optional description
     */
    description?: string;

    /**
     * Append a class name
     */
    className?: string;

    /**
     * Render item opened by default
     */
    open?: boolean;

    /**
     * For testing purpose
     */
    "data-testid"?: string;
    /**
     * Append a class name to Icon
     */
    iconClassName?: string;
};

export const AccordionTrigger = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Trigger>,
    AccordionTriggerProps
>(
    (
        {
            className,
            title,
            description,
            icon,
            actions,
            "data-testid": dataTestId,
            iconClassName,
            ...props
        },
        ref
    ) => (
        <AccordionPrimitive.Header className="flex" data-testid={dataTestId}>
            <AccordionPrimitive.Trigger
                className={cn(
                    "flex px-6 py-4 w-full items-center justify-between transition-all data-[state=open]:bg-gray-100 data-[state=open]:fill-brand-500 hover:bg-gray-200 [&[data-state=open]svg]:rotate-180",
                    className
                )}
                {...props}
                ref={ref}
            >
                <div className={"flex items-center"}>
                    {icon && <div className={cn("mr-6", iconClassName)}>{icon}</div>}
                    <div className={"text-left text-sm"}>
                        {title ? <h2 className={"font-semibold"}>{title}</h2> : null}
                        {description ? (
                            <p className={"font-normal text-gray-700"}>{description}</p>
                        ) : null}
                    </div>
                </div>
                <div className={"flex items-center"}>
                    {actions ? (
                        <>
                            {actions}
                            <AccordionDivider />
                        </>
                    ) : null}
                    <IconButton
                        variant={"ghost"}
                        size={"sm"}
                        className="ml-4 transition-transform duration-200"
                        icon={<ArrowDown />}
                    />
                </div>
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    )
);
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;
