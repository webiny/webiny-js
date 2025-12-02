import * as React from "react";
import { cva } from "~/utils.js";
import { useTagProps } from "./TagPropsProvider.js";
import { Icon } from "~/Icon/Icon.js";

const tagIconVariants = cva("mr-xxs", {
    variants: {
        variant: {
            "neutral-base": "fill-neutral-primary",
            "neutral-base-outline": "fill-neutral-primary",
            "neutral-light": "fill-neutral-primary",
            "neutral-muted": "fill-neutral-primary",
            "neutral-strong": "fill-neutral-light",
            "neutral-xstrong": "fill-neutral-light",
            "neutral-dark": "fill-neutral-light",
            accent: "fill-neutral-light",
            "accent-light": "fill-neutral-primary",
            success: "fill-neutral-light",
            "success-light": "fill-neutral-primary",
            warning: "fill-neutral-primary",
            destructive: "fill-neutral-light"
        },
        disabled: {
            true: ""
        }
    },
    compoundVariants: [
        { variant: "neutral-base", disabled: true, className: "fill-neutral-disabled" },
        { variant: "neutral-base-outline", disabled: true, className: "fill-neutral-disabled" },
        { variant: "neutral-light", disabled: true, className: "fill-neutral-disabled" },
        { variant: "neutral-muted", disabled: true, className: "fill-neutral-disabled" },
        { variant: "accent-light", disabled: true, className: "fill-neutral-muted" },
        { variant: "success-light", disabled: true, className: "fill-neutral-muted" },
        { variant: "warning", disabled: true, className: "fill-neutral-disabled" }
    ],
    defaultVariants: {
        variant: "neutral-base"
    }
});

export const TagIcon = () => {
    const { icon, variant, disabled } = useTagProps();
    if (!icon) {
        return null;
    }

    return (
        <Icon
            label={"Tag icon"}
            icon={icon}
            size="xs"
            className={tagIconVariants({ variant, disabled })}
        />
    );
};
