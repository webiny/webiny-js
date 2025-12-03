import { cva } from "~/utils.js";

export const previewVariants = cva("w-full", {
    variants: {
        variant: {
            light: ["bg-neutral-light", "hover:bg-neutral-dimmed"],
            base: ["bg-neutral-base", "hover:bg-neutral-subtle"],
            transparent: ["bg-transparent", "hover:bg-neutral-dark/5"]
        },
        disabled: {
            true: "pointer-events-none"
        }
    },
    compoundVariants: [
        {
            disabled: true,
            variant: "light",
            className: "bg-neutral-dimmed"
        },
        {
            disabled: true,
            variant: "base",
            className: "bg-neutral-disabled"
        },
        {
            disabled: true,
            variant: "transparent",
            className: "bg-transparent"
        }
    ],
    defaultVariants: {
        variant: "light"
    }
});
