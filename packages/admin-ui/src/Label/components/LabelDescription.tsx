import * as React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";
import { Text } from "~/Text/index.js";

const labelDescriptionVariants = cva("font-normal text-neutral-strong", {
    variants: {
        disabled: {
            true: "text-neutral-disabled"
        }
    }
});

interface LabelDescriptionProps extends VariantProps<typeof labelDescriptionVariants> {
    content: React.ReactNode;
}

const LabelDescription = ({ content, disabled }: LabelDescriptionProps) => (
    <Text className={cn(labelDescriptionVariants({ disabled }))} size={"sm"}>
        {content}
    </Text>
);

export { LabelDescription, type LabelDescriptionProps };
