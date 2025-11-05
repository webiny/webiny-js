import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";

const labelRequiredVariants = cva("text-destructive-primary", {
    variants: {
        disabled: {
            true: "text-destructive-muted"
        }
    }
});

type LabelRequiredProps = VariantProps<typeof labelRequiredVariants>;

const LabelRequired = ({ disabled }: LabelRequiredProps) => (
    <span className={cn(labelRequiredVariants({ disabled }))}>{"*"}</span>
);

export { LabelRequired, type LabelRequiredProps };
