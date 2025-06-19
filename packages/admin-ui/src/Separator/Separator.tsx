import * as React from "react";
import { Separator as SeparatorPrimitive } from "radix-ui";
import { cva, type VariantProps, makeDecoratable } from "~/utils";

const separatorVariants = cva("wby-shrink-0", {
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
            horizontal: "wby-h-px wby-w-full",
            vertical: "wby-h-full wby-w-px"
        },
        variant: {
            transparent: "wby-transparent",
            base: "wby-bg-white",
            dimmed: "wby-bg-neutral-dimmed",
            muted: "wby-bg-neutral-muted",
            strong: "wby-bg-neutral-strong"
        }
    },
    compoundVariants: [
        { orientation: "horizontal", margin: "xs", className: "wby-my-px" },
        { orientation: "horizontal", margin: "sm", className: "wby-my-xxs" },
        { orientation: "horizontal", margin: "md", className: "wby-my-xs" },
        { orientation: "horizontal", margin: "lg", className: "wby-my-sm" },
        { orientation: "horizontal", margin: "xl", className: "wby-my-md" },
        { orientation: "vertical", margin: "xs", className: "wby-mx-px" },
        { orientation: "vertical", margin: "sm", className: "wby-mx-xxs" },
        { orientation: "vertical", margin: "md", className: "wby-mx-xs" },
        { orientation: "vertical", margin: "lg", className: "wby-mx-sm" },
        { orientation: "vertical", margin: "xl", className: "wby-mx-md" }
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
