import * as React from "react";
import { Checkbox as CheckboxPrimitives } from "radix-ui";
import { ReactComponent as CheckIcon } from "@webiny/icons/check.svg";
import { cn, makeDecoratable, cva, type VariantProps } from "~/utils.js";
import { useCheckbox } from "./useCheckbox.js";
import { Label } from "~/Label/index.js";
import type { CheckboxItemDto, CheckboxItemFormatted } from "~/Checkbox/index.js";

/**
 * Indeterminate Icon
 */
const IndeterminateIcon = () => {
    return (
        <span
            className={"block w-sm h-xxs rounded-sm bg-primary group-disabled:bg-primary-disabled"}
        />
    );
};

/**
 * Checkbox Renderer
 */
const checkboxVariants = cva(
    [
        "group peer h-md w-md shrink-0 rounded-sm border-sm ",
        "border-neutral-muted bg-neutral-base [&_svg]:fill-neutral-base! ring-offset-background",
        "hover:border-neutral-dark",
        "focus:outline-none focus-visible:border-accent-default focus-visible:ring-lg focus-visible:ring-primary-dimmed focus-visible:ring-offset-0",
        "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-neutral-disabled",
        "data-[state=checked]:bg-primary data-[state=checked]:border-transparent",
        "data-[state=checked]:hover:bg-primary-strong",
        "data-[state=checked]:disabled:bg-neutral-disabled data-[state=checked]:disabled:fill-neutral-strong"
    ],
    {
        variants: {
            indeterminate: {
                true: [
                    "border-neutral-muted",
                    "data-[state=checked]:bg-neutral-base data-[state=checked]:border-neutral-muted",
                    "data-[state=checked]:hover:bg-neutral-base data-[state=checked]:hover:border-neutral-strong",
                    "data-[state=checked]:focus-visible:border-accent-default",
                    "data-[state=checked]:disabled:border-transparent"
                ]
            },
            hasLabel: {
                true: "mt-xxs"
            }
        }
    }
);

type CheckboxPrimitiveProps = Omit<
    CheckboxPrimitives.CheckboxProps,
    "defaultChecked" | "onCheckedChange" | "onChange"
> &
    VariantProps<typeof checkboxVariants> &
    CheckboxItemDto & {
        onChange: (checked: boolean) => void;
    };

interface CheckboxPrimitiveVm {
    item?: CheckboxItemFormatted;
}

type CheckboxPrimitiveRendererProps = Omit<CheckboxPrimitiveProps, "onCheckedChange" | "onChange"> &
    NonNullable<CheckboxPrimitiveVm["item"]> & {
        changeChecked: (checked: boolean) => void;
    };

const DecoratableCheckboxPrimitiveRenderer = ({
    label,
    id,
    hasLabel,
    indeterminate,
    changeChecked,
    checked,
    className,
    ...props
}: CheckboxPrimitiveRendererProps) => {
    return (
        <div className="flex items-start space-x-sm-extra">
            <CheckboxPrimitives.Root
                {...props}
                id={id}
                className={cn(checkboxVariants({ indeterminate, hasLabel }), className)}
                onCheckedChange={changeChecked}
                checked={indeterminate ? "indeterminate" : checked}
            >
                <span className={cn("flex items-center justify-center")}>
                    {indeterminate ? (
                        <IndeterminateIcon />
                    ) : (
                        <CheckboxPrimitives.Indicator>
                            <CheckIcon className={"size-sm-extra!"} />
                        </CheckboxPrimitives.Indicator>
                    )}
                </span>
            </CheckboxPrimitives.Root>
            {hasLabel && <Label htmlFor={id} text={label} weight={"light"} className={"text-md"} />}
        </div>
    );
};
const CheckboxPrimitiveRenderer = makeDecoratable(
    "CheckboxPrimitiveRenderer",
    DecoratableCheckboxPrimitiveRenderer
);

/**
 * Checkbox
 */
const DecoratableCheckboxPrimitive = (props: CheckboxPrimitiveProps) => {
    const { vm, changeChecked } = useCheckbox(props);

    if (!vm.item) {
        return null;
    }

    return <CheckboxPrimitiveRenderer {...props} {...vm.item} changeChecked={changeChecked} />;
};
const CheckboxPrimitive = makeDecoratable("CheckboxPrimitive", DecoratableCheckboxPrimitive);

export {
    CheckboxPrimitive,
    CheckboxPrimitiveRenderer,
    type CheckboxPrimitiveProps,
    type CheckboxPrimitiveVm
};
