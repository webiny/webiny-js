import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "~/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { makeDecoratable } from "@webiny/react-composition";

const TabsRoot = TabsPrimitive.Root;

/**
 * Tabs list
 */
const TabsListBase = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.List
        ref={ref}
        className={cn(
            "w-full inline-flex items-center justify-start bg-muted fill-muted-foreground p-1 text-muted-foreground",
            className
        )}
        {...props}
    />
));
TabsListBase.displayName = TabsPrimitive.List.displayName;

const TabsList = makeDecoratable("TabsList", TabsListBase);

/**
 * Tabs trigger
 */
const tabsTriggerVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:fill-foreground data-[state=active]:shadow-sm",
    {
        variants: {
            size: {
                sm: "text-xs px-2 py-1",
                md: "text-sm px-3 py-1.5",
                lg: "text-lg px-4 py-2",
                xl: "text-xl px-6 py-3"
            }
        },
        defaultVariants: {
            size: "md"
        }
    }
);

type TabsTriggerProps = Omit<TabsPrimitive.TabsTriggerProps, "children"> &
    VariantProps<typeof tabsTriggerVariants> & {
        text: React.ReactNode;
        icon?: React.ReactNode;
    };

const TabsTriggerBase = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Trigger>,
    TabsTriggerProps
>(({ className, size, icon, text, ...props }, ref) => (
    <TabsPrimitive.Trigger
        ref={ref}
        className={cn(tabsTriggerVariants({ size }), className)}
        {...props}
    >
        {text} {icon}
    </TabsPrimitive.Trigger>
));
TabsTriggerBase.displayName = TabsPrimitive.Trigger.displayName;

const TabsTrigger = makeDecoratable("TabsTrigger", TabsTriggerBase);

/**
 * Tabs content
 */
const tabsContentVariants = cva(
    "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-muted",
    {
        variants: {
            size: {
                sm: "text-xs p-2",
                md: "text-sm p-4",
                lg: "text-lg p-6",
                xl: "text-xl p-8"
            }
        },
        defaultVariants: {
            size: "md"
        }
    }
);

type TabsContentProps = Omit<TabsPrimitive.TabsContentProps, "children"> &
    VariantProps<typeof tabsContentVariants> & {
        text: React.ReactNode;
    };

const TabsContentBase = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Content>,
    TabsContentProps
>(({ className, size, text, ...props }, ref) => (
    <TabsPrimitive.Content
        ref={ref}
        className={cn(tabsContentVariants({ size }), className)}
        {...props}
    >
        {text}
    </TabsPrimitive.Content>
));
TabsContentBase.displayName = TabsPrimitive.Content.displayName;

const TabsContent = makeDecoratable("TabsContent", TabsContentBase);

/**
 * Tabs
 */
interface TabsProps extends TabsPrimitive.TabsProps {
    triggers: React.ReactElement<TabsTriggerProps>[];
    contents: React.ReactElement<TabsContentProps>[];
    size?: "sm" | "md" | "lg" | "xl";
}

const TabsBase = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Root>, TabsProps>(
    ({ defaultValue: baseDefaultValue, size = "md", triggers, contents, ...props }, ref) => {
        const defaultValue = baseDefaultValue || triggers[0].props.value;

        return (
            <TabsRoot ref={ref} defaultValue={defaultValue} {...props}>
                <TabsList>
                    {triggers.map(trigger => (
                        <React.Fragment key={`tab-trigger-${trigger.key}`}>
                            {React.cloneElement(trigger, { size })}
                        </React.Fragment>
                    ))}
                </TabsList>
                {contents.map(content => (
                    <React.Fragment key={`tab-content-${content.key}`}>
                        {React.cloneElement(content, { size })}
                    </React.Fragment>
                ))}
            </TabsRoot>
        );
    }
);
TabsBase.displayName = TabsPrimitive.Root.displayName;

const Tabs = makeDecoratable("Tabs", TabsBase);

export { Tabs, TabsProps, TabsContent, TabsContentProps, TabsTrigger, TabsTriggerProps };
