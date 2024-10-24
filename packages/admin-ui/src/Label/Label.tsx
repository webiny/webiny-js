import * as React from "react";
import { ReactComponent as InfoIcon } from "@material-design-icons/svg/outlined/info.svg";
import * as LabelPrimitive from "@radix-ui/react-label";
import { makeDecoratable } from "@webiny/react-composition";
import { cva, type VariantProps } from "class-variance-authority";

import { Icon } from "~/Icon";
import { Text } from "~/Text";
import { Tooltip } from "~/Tooltip";
import { cn } from "~/utils";

/**
 * Label Required
 */
const LabelRequiredBase = () => <span className={"text-red-500"}>{"*"}</span>;
const LabelRequired = makeDecoratable("LabelRequired", LabelRequiredBase);

/**
 * Label Optional
 */
const LabelOptionalBase = () => (
    <Text className={"ml-1 font-light text-gray-400"} text={"(optional)"} />
);
const LabelOptional = makeDecoratable("LabelOptional", LabelOptionalBase);

/**
 * Label Info
 */
interface LabelInfoProps {
    content: React.ReactNode;
}

const LabelInfoBase = ({ content }: LabelInfoProps) => (
    <span className={"ml-1"}>
        <Tooltip
            content={content}
            trigger={
                <Icon icon={<InfoIcon />} size="sm" label={"More information"} color={"dark"} />
            }
        />
    </span>
);
const LabelInfo = makeDecoratable("LabelInfo", LabelInfoBase);

/**
 * Label Value
 */
const labelValueVariants = cva("", {
    variants: {
        weight: {
            strong: "font-medium",
            light: "font-normal"
        }
    },
    defaultVariants: {
        weight: "strong"
    }
});

interface LabelValueProps extends VariantProps<typeof labelValueVariants> {
    value: React.ReactNode;
}

const LabelValueBase = ({ value, weight }: LabelValueProps) => (
    <Text text={value} className={cn(labelValueVariants({ weight }))} />
);
const LabelValue = makeDecoratable("LabelValue", LabelValueBase);

const labelVariants = cva(
    "inline-flex items-center justify-between w-full text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    {
        variants: {
            weight: {
                strong: "font-medium",
                light: "font-normal"
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
    required?: boolean;
    optional?: boolean;
    info?: React.ReactNode;
}

const LabelBase = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
    ({ className, info, optional, required, value, text, weight, ...props }, ref) => (
        <LabelPrimitive.Root
            ref={ref}
            className={cn(labelVariants({ weight }), className)}
            {...props}
        >
            <span>
                <span className={"flex items-center"}>
                    {text}
                    {required && <LabelRequired />}
                    {info && <LabelInfo content={info} />}
                    {optional && !required && <LabelOptional />}
                </span>
            </span>
            {value && <LabelValue value={value} weight={weight} />}
        </LabelPrimitive.Root>
    )
);
LabelBase.displayName = LabelPrimitive.Root.displayName;

const Label = makeDecoratable("Label", LabelBase);

export { Label, type LabelProps };
