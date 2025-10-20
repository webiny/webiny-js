import React from "react";
import { AccessibleIcon } from "radix-ui";
import { cn, cva, makeDecoratable, type VariantProps } from "~/utils.js";

const iconVariants = cva("shrink-0", {
    variants: {
        size: {
            xs: "size-sm-extra",
            sm: "size-md",
            md: "size-md-plus",
            lg: "size-lg"
        },
        color: {
            inherit: "fill-inherit",
            accent: "fill-accent-default",
            "neutral-light": "fill-neutral-strong",
            "neutral-strong": "fill-neutral-xstrong",
            "neutral-strong-transparent": "fill-neutral-xstrong/30",
            "neutral-base": "fill-neutral-base",
            "neutral-negative": "fill-neutral-base/50"
        }
    },
    defaultVariants: {
        size: "md",
        color: "inherit"
    }
});

interface IconProps
    extends Omit<React.HTMLAttributes<HTMLOrSVGElement>, "color">,
        VariantProps<typeof iconVariants> {
    label: string;
    icon: React.ReactNode;
}

const IconBase = (props: IconProps) => {
    const { label, icon, color, size, className, ...rest } = props;
    return (
        <AccessibleIcon.Root label={label}>
            {/* @ts-expect-error */}
            {React.cloneElement(icon, {
                ...rest,
                className: cn(iconVariants({ color, size }), className)
            })}
        </AccessibleIcon.Root>
    );
};

const Icon = makeDecoratable("Icon", IconBase);

export { Icon, type IconProps };
