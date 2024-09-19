import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/utils";

type TextTags = "span" | "div";

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

interface TextProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof textVariants> {
    as?: TextTags;
    text: React.ReactNode;
}

const TextBase = ({ size, text, className, as: Tag = "span" }: TextProps) => {
    return <Tag className={cn(textVariants({ size, className }))}>{text}</Tag>;
};

const Text = makeDecoratable("Text", TextBase);

export { Text, type TextProps, type TextTags };
