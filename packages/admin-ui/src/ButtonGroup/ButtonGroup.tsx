import * as React from "react";
import { cva, cn, makeDecoratable, type VariantProps } from "~/utils.js";

const buttonGroupVariants = cva("inline-flex items-center flex-nowrap", {
    variants: {
        variant: {
            default: "",
            ghost: ""
        },
        kind: {
            default: "",
            icon: ""
        },
        size: {
            sm: "",
            md: "",
            lg: "",
            xl: ""
        },
        align: {
            start: "",
            end: "justify-end w-full"
        }
    },
    compoundVariants: [
        { variant: "default", kind: "default", size: "sm", className: "gap-xs" },
        { variant: "default", kind: "default", size: "md", className: "gap-xs" },
        { variant: "default", kind: "default", size: "lg", className: "gap-sm" },
        { variant: "default", kind: "default", size: "xl", className: "gap-sm" },
        { variant: "default", kind: "icon", size: "sm", className: "gap-sm" },
        { variant: "default", kind: "icon", size: "md", className: "gap-xs" },
        { variant: "default", kind: "icon", size: "lg", className: "gap-xs" },
        { variant: "default", kind: "icon", size: "xl", className: "gap-xs" },
        { variant: "ghost", kind: "icon", size: "sm", className: "gap-xs" }
    ],
    defaultVariants: {
        variant: "default",
        kind: "default",
        size: "md",
        align: "start"
    }
});

type ButtonGroupVariants = VariantProps<typeof buttonGroupVariants>;

interface ButtonGroupProps {
    /**
     * Accessible name of the group.
     */
    label: string;
    variant?: ButtonGroupVariants["variant"];
    kind?: ButtonGroupVariants["kind"];
    size?: ButtonGroupVariants["size"];
    align?: ButtonGroupVariants["align"];
    className?: string;
    children?: React.ReactNode;
}

const ButtonGroupBase = ({
    label,
    variant,
    kind,
    size,
    align,
    className,
    children
}: ButtonGroupProps) => {
    return (
        <div
            role="group"
            aria-label={label}
            className={cn(buttonGroupVariants({ variant, kind, size, align }), className)}
        >
            {children}
        </div>
    );
};

const ButtonGroup = makeDecoratable("ButtonGroup", ButtonGroupBase);

export { ButtonGroup, type ButtonGroupProps };
