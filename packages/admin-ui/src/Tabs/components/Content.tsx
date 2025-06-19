import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn, cva, type VariantProps } from "~/utils";

const tabContentVariants = cva(
    [
        "wby-bg-transparent",
        "focus-visible:wby-outline-none focus-visible:wby-ring-lg focus-visible:wby-ring-primary-dimmed",
        // By default, the inner content is removed by the DOM when the tab becomes inactive.
        // This is a problem when we need to keep track of the state inside a tab content, such as forms.
        //  We are force-mounting the tab content and this class ensures the content is hidden, but not removed from the DOM.
        "data-[state=inactive]:wby-hidden"
    ],
    {
        variants: {
            spacing: {
                xs: "wby-p-xs",
                sm: "wby-p-sm",
                md: "wby-p-md",
                lg: "wby-p-lg",
                xl: "wby-p-xl",
                xxl: "wby-p-xxl"
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
