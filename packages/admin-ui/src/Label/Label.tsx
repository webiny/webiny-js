import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cn, makeDecoratable, cva, type VariantProps } from "~/utils";
import { LabelDescription, LabelHint, LabelRequired, LabelValue } from "./components";

const labelVariants = cva(
    [
        "wby-inline-flex wby-items-center wby-justify-between wby-w-full wby-text-sm",
        "wby-text-neutral-primary wby-whitespace-nowrap",
        "peer-disabled:wby-text-neutral-disabled peer-disabled:wby-cursor-not-allowed"
    ],
    {
        variants: {
            weight: {
                strong: "wby-font-semibold",
                light: "wby-font-regular"
            },
            disabled: {
                true: "wby-text-neutral-disabled wby-cursor-not-allowed"
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
                <span className={"wby-flex wby-items-center wby-gap-xxs"}>
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
