import React from "react";
import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import { makeDecoratable } from "@webiny/react-composition";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/utils";

const iconVariants = cva("", {
    variants: {
        size: {
            sm: "w-4 h-4",
            md: "w-5 h-5",
            lg: "w-6 h-6"
        },
        color: {
            primary: "fill-primary",
            dark: "fill-black",
            light: "fill-black/20",
            white: "fill-white"
        }
    },
    defaultVariants: {
        size: "md",
        color: "dark"
    }
});

interface IconProps
    extends Omit<React.HTMLAttributes<HTMLOrSVGElement>, "color">,
        VariantProps<typeof iconVariants> {
    label: string;
    icon: React.ReactElement;
}

const IconBase = React.forwardRef<HTMLOrSVGElement, IconProps>((props, ref) => {
    const { label, icon, color, size, className, ...rest } = props;
    return (
        <AccessibleIcon.Root label={label}>
            {React.cloneElement(icon, {
                ...rest,
                className: cn(iconVariants({ color, size, className })),
                ref
            })}
        </AccessibleIcon.Root>
    );
});

IconBase.displayName = "Icon";

const Icon = makeDecoratable("Icon", IconBase);

export { Icon, type IconProps };
