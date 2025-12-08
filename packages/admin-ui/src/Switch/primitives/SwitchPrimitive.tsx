import * as React from "react";
import { Switch as SwitchPrimitives } from "radix-ui";
import { cn, cva, makeDecoratable, type VariantProps } from "~/utils.js";
import { Label } from "~/Label/index.js";
import { useSwitch } from "./useSwitch.js";
import type { SwitchItemDto, SwitchItemFormatted } from "../domains/index.js";

/**
 * Switch Renderer
 */

const switchVariants = cva("inline-flex items-start space-x-sm", {
    variants: {
        labelPosition: {
            start: "",
            end: "flex-row-reverse space-x-sm-extra space-x-reverse"
        }
    },
    defaultVariants: {
        labelPosition: "start"
    }
});

type SwitchPrimitiveProps = Omit<
    SwitchPrimitives.SwitchProps,
    "defaultChecked" | "onCheckedChange" | "onChange"
> &
    VariantProps<typeof switchVariants> &
    SwitchItemDto & {
        onChange?: (checked: boolean) => void;
    };

type SwitchPrimitivVm = {
    item?: SwitchItemFormatted;
};

type SwitchRendererProps = Omit<SwitchPrimitiveProps, "onCheckedChange"> &
    NonNullable<SwitchPrimitivVm["item"]> & {
        changeChecked: (checked: boolean) => void;
        description?: React.ReactNode;
    };

const SwitchRenderer = ({
    id,
    label,
    changeChecked,
    description,
    className,
    labelPosition,
    disabled,
    required,
    checked
}: SwitchRendererProps) => {
    return (
        <div className={cn(switchVariants({ labelPosition }), className)}>
            <Label
                htmlFor={id}
                text={label}
                disabled={disabled}
                required={required}
                hint={description}
                weight={"light"}
                className={"text-md"}
            />
            <SwitchPrimitives.Root
                id={id}
                checked={checked}
                className={cn([
                    "peer inline-flex h-md w-[26px] mt-xxs shrink-0 cursor-pointer items-center rounded-xxl border-sm transition-colors",
                    "border-transparent data-[state=checked]:bg-secondary data-[state=unchecked]:bg-neutral-strong",
                    "focus-visible:outline-none focus-visible:border-success focus-visible:ring-lg focus-visible:ring-primary-dimmed",
                    "disabled:cursor-not-allowed disabled:bg-neutral-muted disabled:data-[state=checked]:bg-neutral-muted"
                ])}
                disabled={disabled}
                onCheckedChange={changeChecked}
            >
                <SwitchPrimitives.Thumb
                    className={cn(
                        "pointer-events-none block h-sm-plus w-sm-plus rounded-xxl bg-neutral-base shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-sm-extra data-[state=unchecked]:translate-x-xxs"
                    )}
                />
            </SwitchPrimitives.Root>
        </div>
    );
};

/**
 * Switch
 */
const DecoratableSwitchPrimitive = (props: SwitchPrimitiveProps) => {
    const { vm, changeChecked } = useSwitch(props);

    if (!vm.item) {
        return null;
    }

    return <SwitchRenderer {...props} {...vm.item} changeChecked={changeChecked} />;
};
const SwitchPrimitive = makeDecoratable("SwitchPrimitive", DecoratableSwitchPrimitive);

export { SwitchPrimitive, type SwitchPrimitiveProps, type SwitchPrimitivVm };
