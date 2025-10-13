import React from "react";
import { cva, type VariantProps, makeDecoratable, cn } from "~/utils.js";
import { SimpleLink, type SimpleLinkProps } from "@webiny/app";

const linkVariants = cva("font-sans rounded-xs", {
    variants: {
        size: {
            inherit: "[font-size:inherit]",
            sm: "text-sm",
            md: "text-md",
            lg: "text-lg",
            xl: "text-xl"
        },
        variant: {
            primary: [
                "text-accent-primary",
                "focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-primary-dimmed"
            ],
            secondary: [
                "text-neutral-primary",
                "focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-primary-dimmed"
            ],
            "primary-negative": [
                "text-accent-primary",
                "focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-primary-strong"
            ],
            "secondary-negative": [
                "text-neutral-light",
                "focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-primary-strong"
            ]
        },
        underline: {
            true: "underline hover:no-underline",
            false: "hover:underline"
        }
    },
    defaultVariants: {
        size: "inherit",
        variant: "primary",
        underline: false
    }
});

export type LinkProps = SimpleLinkProps &
    VariantProps<typeof linkVariants> & {
        disabled?: boolean;
    };

function LinkBase({ size, variant, underline, className, children, ...rest }: LinkProps) {
    return (
        <SimpleLink {...rest} className={cn(linkVariants({ size, variant, underline }), className)}>
            {children}
        </SimpleLink>
    );
}

export const Link = makeDecoratable("Link", LinkBase);
