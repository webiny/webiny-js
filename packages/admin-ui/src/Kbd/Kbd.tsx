import * as React from "react";
import { cn } from "~/utils.js";
import { cva } from "~/utils.js";
import { makeDecoratable } from "~/utils.js";
import type { VariantProps } from "~/utils.js";

const kbdKeyVariants = cva(
    [
        "inline-flex h-md-plus min-w-md-plus shrink-0 items-center justify-center rounded-sm border-sm px-xs",
        "font-sans text-sm font-normal text-neutral-strong"
    ],
    {
        variants: {
            variant: {
                // For white and subtle surfaces: lists, footers, menus.
                outline: "border-neutral-muted bg-neutral-base",
                // For inside an input, where an outline would read as a second field.
                light: "border-transparent bg-neutral-light"
            }
        },
        defaultVariants: {
            variant: "outline"
        }
    }
);

interface KbdProps
    extends
        Omit<React.HTMLAttributes<HTMLElement>, "children">,
        VariantProps<typeof kbdKeyVariants> {
    /**
     * The keys of one shortcut, one cap each: `["⌘", "K"]`, or a space-separated string, `"⌘ K"`.
     */
    keys: string | string[];
    /** The accessible name of the whole shortcut, e.g. "Command K". */
    label?: string;
}

const toKeys = (keys: string | string[]): string[] => {
    if (Array.isArray(keys)) {
        return keys;
    }
    return keys.split(" ").filter(Boolean);
};

/** A keyboard shortcut as key caps. A hint, never a button. */
const KbdBase = ({ keys, label, variant, className, ...props }: KbdProps) => (
    <kbd
        aria-label={label}
        className={cn("inline-flex shrink-0 items-center gap-xxs align-middle", className)}
        {...props}
    >
        {toKeys(keys).map((key, index) => (
            <kbd key={index} className={kbdKeyVariants({ variant })}>
                {key}
            </kbd>
        ))}
    </kbd>
);

const Kbd = makeDecoratable("Kbd", KbdBase);

export { Kbd, type KbdProps };
