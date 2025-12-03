import React from "react";
import { cn, cva, makeDecoratable, type VariantProps } from "~/utils.js";

type TextTags = "span" | "div";

const textVariants = cva("font-sans", {
    variants: {
        size: {
            xl: "text-xl",
            lg: "text-lg",
            md: "text-md",
            sm: "text-sm"
        }
    },
    defaultVariants: {
        size: "md"
    }
});

interface TextProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof textVariants> {
    as?: TextTags;
}

const TextBase = ({ children, size, className, as: Tag = "span", ...props }: TextProps) => {
    return (
        <Tag {...props} className={cn(textVariants({ size }), className)}>
            {children}
        </Tag>
    );
};

const Text = makeDecoratable("Text", TextBase);

export { Text, type TextProps, type TextTags };
