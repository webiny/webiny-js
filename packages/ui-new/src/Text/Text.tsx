import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/utils";

export type TextTags = "span" | "div";

const textVariants = cva("font-sans font-normal", {
    variants: {
        size: {
            xl: "text-xl leading-normal",
            lg: "text-base leading-normal",
            md: "text-sm leading-normal",
            sm: "text-xs leading-normal"
        }
    },
    defaultVariants: {
        size: "md"
    }
});

export interface TextProps
    extends React.HTMLAttributes<HTMLElement>,
        VariantProps<typeof textVariants> {
    text: string | React.ReactNode;
    className?: string;
    as?: TextTags;
}

export const Text = ({ size, text, className, as: Tag = "span" }: TextProps) => {
    return <Tag className={cn(textVariants({ size, className }))}>{text}</Tag>;
};
