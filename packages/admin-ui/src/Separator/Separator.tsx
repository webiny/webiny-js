import * as React from "react";
import { Separator as SeparatorPrimitive } from "radix-ui";
import { cva, type VariantProps, makeDecoratable } from "~/utils.js";

const separatorVariants = cva("shrink-0", {
    variants: {
        margin: {
            none: "",
            xs: "",
            sm: "",
            md: "",
            lg: "",
            xl: ""
        },
        orientation: {
            horizontal: "h-px w-full",
            vertical: "h-full w-px"
        },
        variant: {
            transparent: "transparent",
            base: "bg-white",
            dimmed: "bg-neutral-dimmed",
            muted: "bg-neutral-muted",
            strong: "bg-neutral-strong",
            accent: "bg-primary"
        }
    },
    compoundVariants: [
        { orientation: "horizontal", margin: "xs", className: "my-px" },
        { orientation: "horizontal", margin: "sm", className: "my-xxs" },
        { orientation: "horizontal", margin: "md", className: "my-xs" },
        { orientation: "horizontal", margin: "lg", className: "my-sm" },
        { orientation: "horizontal", margin: "xl", className: "my-md" },
        { orientation: "vertical", margin: "xs", className: "mx-px" },
        { orientation: "vertical", margin: "sm", className: "mx-xxs" },
        { orientation: "vertical", margin: "md", className: "mx-xs" },
        { orientation: "vertical", margin: "lg", className: "mx-sm" },
        { orientation: "vertical", margin: "xl", className: "mx-md" }
    ],
    defaultVariants: {
        orientation: "horizontal",
        variant: "dimmed",
        margin: "none"
    }
});

type SeparatorPosition = "start" | "middle" | "end";

type SeparatorProps = Omit<SeparatorPrimitive.SeparatorProps, "children"> &
    VariantProps<typeof separatorVariants> & {
        children?: React.ReactNode;
        labelPosition?: SeparatorPosition;
    };

const SeparatorBase = ({
    className,
    orientation = "horizontal",
    margin,
    variant,
    decorative = true,
    children,
    labelPosition = "middle",
    ...props
}: SeparatorProps) => {
    // If no children, render simple separator
    if (!children) {
        return (
            <SeparatorPrimitive.Root
                decorative={decorative}
                orientation={orientation}
                className={separatorVariants({ orientation, margin, variant, className })}
                {...props}
            />
        );
    }

    // With children, render separator with label
    const isHorizontal = orientation === "horizontal";
    const containerClass = isHorizontal
        ? "flex items-center w-full"
        : "flex flex-col items-center h-full";
    const separatorClass = separatorVariants({ orientation, variant });
    const baseLabelClass = "text-neutral-primary text-md font-semibold";

    const renderContent = () => {
        if (labelPosition === "start") {
            return (
                <>
                    <span className={`${baseLabelClass} pr-md`}>{children}</span>
                    <SeparatorPrimitive.Root
                        decorative={decorative}
                        orientation={orientation}
                        className={`${separatorClass} flex-1`}
                        {...props}
                    />
                </>
            );
        }

        if (labelPosition === "end") {
            return (
                <>
                    <SeparatorPrimitive.Root
                        decorative={decorative}
                        orientation={orientation}
                        className={`${separatorClass} flex-1`}
                        {...props}
                    />
                    <span className={`${baseLabelClass} pl-md`}>{children}</span>
                </>
            );
        }

        // middle (default)
        return (
            <>
                <SeparatorPrimitive.Root
                    decorative={decorative}
                    orientation={orientation}
                    className={`${separatorClass} flex-1`}
                    {...props}
                />
                <span className={`${baseLabelClass} px-md`}>{children}</span>
                <SeparatorPrimitive.Root
                    decorative={decorative}
                    orientation={orientation}
                    className={`${separatorClass} flex-1`}
                    {...props}
                />
            </>
        );
    };

    return <div className={`${containerClass} ${className || ""}`}>{renderContent()}</div>;
};

const Separator = makeDecoratable("Separator", SeparatorBase);

export { Separator, type SeparatorProps };
