import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";
import { useWidgetProps } from "~/Widget/components/WidgetPropsProvider.js";

const widgetContentVariants = cva("text-md text-neutral-primary overflow-hidden rounded-xl", {
    variants: {
        variant: {
            accent: "bg-primary-subtle",
            light: "bg-neutral-light",
            base: "bg-neutral-base"
        },
        elevation: {
            none: "",
            sm: "shadow-sm",
            md: "shadow-md",
            lg: "shadow-lg"
        },
        outline: {
            true: "border-sm border-solid border-neutral-dimmed-darker",
            false: ""
        }
    },
    defaultVariants: {
        variant: "base",
        outline: false
    }
});

export interface WidgetContentProps extends VariantProps<typeof widgetContentVariants> {
    className?: string;
    children: React.ReactNode;
}

const WidgetContent = ({ children }: WidgetContentProps) => {
    const { variant, elevation, outline, className } = useWidgetProps();

    return (
        <div
            data-widget="content"
            className={cn(widgetContentVariants({ variant, elevation, outline }), className)}
        >
            <div className={"flex flex-col justify-between w-full max-w-full h-full relative"}>
                {children}
            </div>
        </div>
    );
};

WidgetContent.displayName = "WidgetContent";

export { WidgetContent };
