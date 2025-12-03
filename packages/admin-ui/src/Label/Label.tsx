import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cn, makeDecoratable, cva, type VariantProps } from "~/utils.js";
import { LabelDescription, LabelHint, LabelRequired, LabelValue } from "./components/index.js";

const labelVariants = cva(
    [
        "inline-flex items-center justify-between w-full text-sm",
        "text-neutral-primary whitespace-nowrap",
        "peer-disabled:text-neutral-disabled peer-disabled:cursor-not-allowed"
    ],
    {
        variants: {
            weight: {
                strong: "font-semibold",
                light: "font-regular"
            },
            disabled: {
                true: "text-neutral-disabled cursor-not-allowed"
            },
            invalid: {
                true: "webiny_label-invalid"
            }
        },
        defaultVariants: {
            weight: "strong"
        }
    }
);

interface LabelProps
    extends Omit<React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>, "children">,
        VariantProps<typeof labelVariants> {
    text: React.ReactNode;
    value?: React.ReactNode;
    description?: React.ReactNode;
    hint?: React.ReactNode;
    required?: boolean;
    disabled?: boolean;
}

const LabelBase = ({
    className,
    disabled,
    description,
    hint,
    required,
    value,
    text,
    weight,
    invalid,
    ...props
}: LabelProps) => {
    if (!text) {
        return null;
    }

    return (
        <LabelPrimitive.Root
            className={cn(labelVariants({ weight, disabled, invalid }), className)}
            {...props}
        >
            <span>
                <span className={"flex items-center gap-xxs"}>
                    <span className={"webiny_label-text"}>{text}</span>
                    {description && <LabelDescription content={description} disabled={disabled} />}
                    {hint && <LabelHint content={hint} />}
                    {required && <LabelRequired disabled={disabled} />}
                </span>
            </span>
            {value && <LabelValue value={value} weight={weight} disabled={disabled} />}
        </LabelPrimitive.Root>
    );
};

const Label = makeDecoratable("Label", LabelBase);

export { Label, type LabelProps };
