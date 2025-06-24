import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn, makeDecoratable } from "~/utils";
import { Label } from "~/Label";

/**
 * RadioItem
 */
interface RadioProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
    label: string | React.ReactNode;
    id: string;
}

const DecoratableRadio = ({ className, label, id, ...props }: RadioProps) => {
    return (
        <div className="wby-flex wby-items-start wby-space-x-sm-extra">
            <RadioGroupPrimitive.Item
                id={id}
                className={cn(
                    [
                        "wby-group wby-peer wby-aspect-square wby-h-md wby-w-md wby-rounded-xl wby-mt-xxs",
                        "wby-bg-neutral-base wby-border-sm wby-border-neutral-muted wby-ring-offset-background",
                        "focus:wby-outline-none focus-visible:wby-border-accent-default focus-visible:wby-ring-lg focus-visible:wby-ring-primary-dimmed focus-visible:wby-ring-offset-0",
                        "disabled:wby-cursor-not-allowed disabled:wby-border-neutral-muted disabled:wby-bg-neutral-disabled"
                    ],
                    className
                )}
                {...props}
            >
                <RadioGroupPrimitive.Indicator className="wby-flex wby-items-center wby-justify-center">
                    <span
                        className={cn([
                            "wby-h-sm wby-w-sm wby-rounded-xl",
                            "wby-bg-primary-default",
                            "group-disabled:wby-bg-neutral-strong"
                        ])}
                    />
                </RadioGroupPrimitive.Indicator>
            </RadioGroupPrimitive.Item>
            <Label htmlFor={id} text={label} weight={"light"} className={"wby-text-md"} />
        </div>
    );
};
const Radio = makeDecoratable("Radio", DecoratableRadio);

export { Radio, type RadioProps };
