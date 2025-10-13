import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils.js";

const tabContentVariants = cva(
    [
        "bg-transparent",
        "focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed",
        // By default, the inner content is removed by the DOM when the tab becomes inactive.
        // This is a problem when we need to keep track of the state inside a tab content, such as forms.
        //  We are force-mounting the tab content and this class ensures the content is hidden, but not removed from the DOM.
        "data-[state=inactive]:hidden"
    ],
    {
        variants: {
            spacing: {
                xs: "p-xs",
                sm: "p-sm",
                md: "p-md",
                lg: "p-lg",
                xl: "p-xl",
                xxl: "p-xxl"
            }
        }
    }
);

type ContentProps = Omit<TabsPrimitive.TabsContentProps, "children" | "content"> &
    VariantProps<typeof tabContentVariants> & {
        content: React.ReactNode;
    };

const Content = ({ className, content, spacing, ...props }: ContentProps) => (
    <TabsPrimitive.Content
        className={cn(tabContentVariants({ spacing }), className)}
        forceMount={true}
        {...props}
    >
        {content}
    </TabsPrimitive.Content>
);

export { Content, type ContentProps };
