import * as React from "react";
import { cn } from "~/utils.js";
import { cva } from "~/utils.js";
import { makeDecoratable } from "~/utils.js";
import type { VariantProps } from "~/utils.js";

/*
 * The mono face runs 1px smaller than the Inter text around it, so the two read at the same size:
 * 13px inside `text-md`, 12px inside `text-sm`.
 */
const codeVariants = cva(
    "rounded-sm bg-neutral-light px-xs py-px font-mono font-normal text-neutral-primary",
    {
        variants: {
            size: {
                md: "text-[13px] leading-5",
                sm: "text-sm"
            }
        },
        defaultVariants: {
            size: "md"
        }
    }
);

interface CodeProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof codeVariants> {}

/** A short piece of code in running text: an API name, a field ID, a GraphQL type or a JSON key. */
const CodeBase = ({ size, className, ...props }: CodeProps) => (
    <code className={cn(codeVariants({ size }), className)} {...props} />
);

const Code = makeDecoratable("Code", CodeBase);

export { Code, type CodeProps };
