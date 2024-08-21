import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/utils";

export type HeadingTags = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type HeadingLevels = 1 | 2 | 3 | 4 | 5 | 6;

// Create a mapping of variant to tag
const TAG_MAP: Record<HeadingLevels, HeadingTags> = {
    1: "h1",
    2: "h2",
    3: "h3",
    4: "h4",
    5: "h5",
    6: "h6"
};

const headingVariants = cva("font-sans font-semibold", {
    variants: {
        level: {
            1: "text-5xl leading-tight",
            2: "text-4xl leading-tight",
            3: "text-3xl leading-tight",
            4: "text-xl leading-normal",
            5: "text-base leading-normal",
            6: "text-sm leading-normal"
        }
    },
    defaultVariants: {
        level: 1
    }
});

export interface HeadingProps
    extends React.HTMLAttributes<HTMLHeadingElement>,
        VariantProps<typeof headingVariants> {
    as?: HeadingTags;
    text: React.ReactNode;
}

export const Heading = ({ level, text, className, as }: HeadingProps) => {
    // Ensure `level` is a valid number, or fallback to a default value 1
    const validatedLevel = level && level in TAG_MAP ? level : 1;

    // Choose the tag: prefer `as`, otherwise use `TAG_MAP[validatedLevel]`
    const Tag = as || TAG_MAP[validatedLevel];

    return <Tag className={cn(headingVariants({ level, className }))}>{text}</Tag>;
};
