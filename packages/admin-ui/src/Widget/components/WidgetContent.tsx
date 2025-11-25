import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";
import { useWidgetProps } from "~/Widget/components/WidgetPropsProvider.js";

const widgetContentVariants = cva(
    ["border-md border-solid bg-neutral-base text-md text-neutral-strong overflow-hidden"],
    {
        variants: {
            cornerSize: {
                md: "rounded-lg",
                lg: "rounded-xl"
            },
            variant: {
                default: "border-transparent",
                accent: "border-accent-dimmed"
            },
            elevation: {
                none: "",
                small: "shadow-sm",
                medium: "shadow-md",
                large: "shadow-lg"
            }
        },
        defaultVariants: {
            cornerSize: "lg",
            variant: "default"
        }
    }
);

export interface WidgetContentProps extends VariantProps<typeof widgetContentVariants> {
    className?: string;
    children: React.ReactNode;
}

const WidgetContent = ({ children }: WidgetContentProps) => {
    const { cornerSize, variant, elevation, className } = useWidgetProps();

    return (
        <div
            data-widget="content"
            className={cn(widgetContentVariants({ cornerSize, variant, elevation }), className)}
        >
            <div className={"flex flex-col justify-between w-full max-w-full h-full relative"}>
                {children}
            </div>
        </div>
    );
};

WidgetContent.displayName = "WidgetContent";

export { WidgetContent };

