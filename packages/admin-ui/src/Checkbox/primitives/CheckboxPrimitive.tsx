import * as React from "react";
import { Checkbox as CheckboxPrimitives } from "radix-ui";
import { ReactComponent as CheckIcon } from "@webiny/icons/check.svg";
import { cn, makeDecoratable, cva, type VariantProps } from "~/utils";
import { useCheckbox } from "./useCheckbox";
import { Label } from "~/Label";
import type { CheckboxItemDto, CheckboxItemFormatted } from "~/Checkbox";

/**
 * Indeterminate Icon
 */
const IndeterminateIcon = () => {
    return (
        <span
            className={
                "wby-block wby-w-sm wby-h-xxs wby-rounded-sm wby-bg-primary-default group-disabled:wby-bg-primary-disabled"
            }
        />
    );
};

/**
 * Checkbox Renderer
 */
const checkboxVariants = cva(
    [
        "wby-group wby-peer wby-h-md wby-w-md wby-shrink-0 wby-rounded-sm wby-border-sm ",
        "wby-border-neutral-muted wby-bg-neutral-base [&_svg]:!wby-fill-neutral-base wby-ring-offset-background",
        "hover:wby-border-neutral-dark",
        "focus:wby-outline-none focus-visible:wby-border-accent-default focus-visible:wby-ring-lg focus-visible:wby-ring-primary-dimmed focus-visible:wby-ring-offset-0",
        "disabled:wby-cursor-not-allowed disabled:wby-border-transparent disabled:wby-bg-neutral-disabled",
        "data-[state=checked]:wby-bg-primary-default data-[state=checked]:wby-border-transparent",
        "data-[state=checked]:hover:wby-bg-primary-strong",
        "data-[state=checked]:disabled:wby-bg-neutral-disabled data-[state=checked]:disabled:wby-fill-neutral-strong"
    ],
    {
        variants: {
            indeterminate: {
                true: [
                    "wby-border-neutral-muted",
                    "data-[state=checked]:wby-bg-neutral-base data-[state=checked]:wby-border-neutral-muted",
                    "data-[state=checked]:hover:wby-bg-neutral-base data-[state=checked]:hover:wby-border-neutral-strong",
                    "data-[state=checked]:focus-visible:wby-border-accent-default",
                    "data-[state=checked]:disabled:wby-border-transparent"
                ]
            },
            hasLabel: {
                true: "wby-mt-xxs"
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
        <div className="wby-flex wby-items-start wby-space-x-sm-extra">
            <CheckboxPrimitives.Root
                {...props}
                id={id}
                className={cn(checkboxVariants({ indeterminate, hasLabel }), className)}
                onCheckedChange={changeChecked}
                checked={indeterminate ? "indeterminate" : checked}
            >
                <span className={cn("wby-flex wby-items-center wby-justify-center")}>
                    {indeterminate ? (
                        <IndeterminateIcon />
                    ) : (
                        <CheckboxPrimitives.Indicator>
                            <CheckIcon className={"!wby-size-sm-extra"} />
                        </CheckboxPrimitives.Indicator>
                    )}
                </span>
            </CheckboxPrimitives.Root>
            {hasLabel && (
                <Label htmlFor={id} text={label} weight={"light"} className={"wby-text-md"} />
            )}
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
