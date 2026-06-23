import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils.js";
import { Icon } from "~/Icon/index.js";
import { Skeleton } from "~/Skeleton/index.js";

const tabTriggerVariants = cva(
    [
        "group inline-flex items-center justify-center whitespace-nowrap outline-none transition-all",
        "text-neutral-strong hover:text-neutral-primary",
        "border-b-md border-transparent border-solid",
        "data-[state=active]:border-accent-default data-[state=active]:text-neutral-primary",
        "disabled:pointer-events-none disabled:text-neutral-disabled! disabled:fill-neutral-disabled! disabled:border-transparent!"
    ],
    {
        variants: {
            size: {
                sm: "text-sm h-[40px]",
                md: "text-md h-xxl",
                lg: "text-lg h-[56px]",
                xl: "text-xl h-3xl"
            },
            visible: {
                false: "hidden"
            }
        },
        defaultVariants: {
            size: "sm"
        }
    }
);

const innerTabTriggerVariants = cva(
    [
        "inline-flex items-center justify-start gap-xs",
        "group-hover:bg-neutral-dimmed",
        "group-focus-visible:ring-lg group-focus-visible:ring-primary-dimmed"
    ],
    {
        variants: {
            size: {
                sm: "rounded-sm p-xs",
                md: "rounded-sm px-xs py-xs-plus",
                lg: "rounded-sm px-xs-plus py-sm-plus",
                xl: "rounded-lg px-sm py-sm-plus"
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
        loading?: boolean;
        "data-testid"?: string;
    };

const Trigger = ({ className, size, icon, text, visible, loading, ...props }: TriggerProps) => (
    <TabsPrimitive.Trigger
        className={cn(tabTriggerVariants({ size, visible }), className)}
        {...props}
    >
        <div className={cn(innerTabTriggerVariants({ size }))}>
            {loading ? (
                <Skeleton type={"text"} size={"md"} className={"w-[64px]"} />
            ) : (
                <>
                    {icon && (
                        <Icon
                            icon={icon}
                            size={"sm"}
                            label={String(text)}
                            color={"neutral-light"}
                        />
                    )}
                    {text}
                </>
            )}
        </div>
    </TabsPrimitive.Trigger>
);

export { Trigger, type TriggerProps };
