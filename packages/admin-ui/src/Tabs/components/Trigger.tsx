import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils";
import { Icon } from "~/Icon";

const tabTriggerVariants = cva(
    [
        "wby-group wby-inline-flex wby-items-center wby-justify-center wby-whitespace-nowrap wby-outline-none wby-transition-all",
        "wby-text-neutral-strong hover:text-neutral-primary",
        "wby-border-b-md wby-border-transparent wby-border-solid",
        "data-[state=active]:wby-border-accent-default data-[state=active]:wby-text-neutral-primary",
        "disabled:wby-pointer-events-none disabled:!wby-text-neutral-disabled disabled:!wby-fill-neutral-disabled disabled:!wby-border-transparent"
    ],
    {
        variants: {
            size: {
                sm: "wby-text-sm wby-h-[40px]",
                md: "wby-text-md wby-h-[48px]",
                lg: "wby-text-lg wby-h-[56px]",
                xl: "wby-text-xl wby-h-[64px]"
            },
            visible: {
                false: "wby-hidden"
            }
        },
        defaultVariants: {
            size: "sm"
        }
    }
);

const innerTabTriggerVariants = cva(
    [
        "wby-inline-flex wby-items-center wby-justify-start wby-gap-xs",
        "group-hover:wby-bg-neutral-dimmed",
        "group-focus-visible:wby-ring-lg group-focus-visible:wby-ring-primary-dimmed"
    ],
    {
        variants: {
            size: {
                sm: "wby-rounded-sm wby-p-xs",
                md: "wby-rounded-sm wby-px-xs wby-py-xs-plus",
                lg: "wby-rounded-sm wby-px-xs-plus wby-py-sm-plus",
                xl: "wby-rounded-lg wby-px-sm wby-py-sm-plus"
            }
        },
        defaultVariants: {
            size: "sm"
        }
    }
);

type TriggerProps = Omit<TabsPrimitive.TabsTriggerProps, "children"> &
    VariantProps<typeof tabTriggerVariants> & {
        text: React.ReactNode;
        icon?: React.ReactElement;
        "data-testid"?: string;
    };

const Trigger = ({ className, size, icon, text, visible, ...props }: TriggerProps) => (
    <TabsPrimitive.Trigger
        className={cn(tabTriggerVariants({ size, visible }), className)}
        {...props}
    >
        <div className={cn(innerTabTriggerVariants({ size }))}>
            {icon && <Icon icon={icon} size={"sm"} label={String(text)} color={"neutral-light"} />}
            {text}
        </div>
    </TabsPrimitive.Trigger>
);

export { Trigger, type TriggerProps };
