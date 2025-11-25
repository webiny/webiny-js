import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";
import { useWidgetProps } from "~/Widget/components/WidgetPropsProvider.js";

const widgetContentVariants = cva(
    ["bg-neutral-base text-md text-neutral-strong overflow-hidden rounded-lg"],
    {
        variants: {
            variant: {
                default: "",
                accent: "border-md border-solid border-accent-dimmed"
            },
            elevation: {
                none: "",
                small: "shadow-sm",
                medium: "shadow-md",
                large: "shadow-lg"
            },
            outline: {
                true: "border-sm border-solid border-neutral-dimmed-darker",
                false: ""
            }
        },
        defaultVariants: {
            variant: "default",
            outline: false
        }
    }
);

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

