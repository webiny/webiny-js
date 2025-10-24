import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn, makeDecoratable } from "~/utils.js";
import { Label } from "~/Label/index.js";

/**
 * RadioItem
 */
interface RadioProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
    label: string | React.ReactNode;
    id: string;
}

const DecoratableRadio = ({ className, label, id, ...props }: RadioProps) => {
    return (
        <div className="flex items-start space-x-sm-extra">
            <RadioGroupPrimitive.Item
                id={id}
                className={cn(
                    [
                        "group peer aspect-square h-md w-md rounded-xl mt-xxs",
                        "bg-neutral-base border-sm border-neutral-muted ring-offset-background",
                        "focus:outline-none focus-visible:border-accent-default focus-visible:ring-lg focus-visible:ring-primary-dimmed focus-visible:ring-offset-0",
                        "disabled:cursor-not-allowed disabled:border-neutral-muted disabled:bg-neutral-disabled"
                    ],
                    className
                )}
                {...props}
            >
                <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                    <span
                        className={cn([
                            "h-sm w-sm rounded-xl",
                            "bg-primary",
                            "group-disabled:bg-neutral-strong"
                        ])}
                    />
                </RadioGroupPrimitive.Indicator>
            </RadioGroupPrimitive.Item>
            <Label htmlFor={id} text={label} weight={"light"} className={"text-md"} />
        </div>
    );
};
const Radio = makeDecoratable("Radio", DecoratableRadio);

export { Radio, type RadioProps };
