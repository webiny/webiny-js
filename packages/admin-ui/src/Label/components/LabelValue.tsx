import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";
import { Text } from "~/Text/index.js";

const labelValueVariants = cva("text-neutral-strong", {
    variants: {
        weight: {
            strong: "font-semibold",
            light: "font-regular"
        },
        disabled: {
            true: "text-neutral-disabled"
        }
    },
    defaultVariants: {
        weight: "strong"
    }
});

interface LabelValueProps extends VariantProps<typeof labelValueVariants> {
    value: React.ReactNode;
}

const LabelValue = ({ value, weight, disabled }: LabelValueProps) => (
    <Text size="sm" className={cn(labelValueVariants({ weight, disabled }))}>
        {value}
    </Text>
);

export { LabelValue, type LabelValueProps };
