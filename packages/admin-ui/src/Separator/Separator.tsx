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
            strong: "bg-neutral-strong"
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

type SeparatorProps = SeparatorPrimitive.SeparatorProps & VariantProps<typeof separatorVariants>;

const SeparatorBase = ({
    className,
    orientation,
    margin,
    variant,
    decorative = true,
    ...props
}: SeparatorProps) => (
    <SeparatorPrimitive.Root
        decorative={decorative}
        orientation={orientation}
        className={separatorVariants({ orientation, margin, variant, className })}
        {...props}
    />
);

const Separator = makeDecoratable("Separator", SeparatorBase);

export { Separator, type SeparatorProps };
