import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, generateId } from "~/utils";
import { Label } from "~/Label";
import { makeDecoratable } from "@webiny/react-composition";

const switchVariants = cva("flex items-center space-x-2", {
    variants: {
        labelPosition: {
            leading: "",
            trailing: "flex-row-reverse space-x-reverse "
        }
    },
    defaultVariants: {
        labelPosition: "leading"
    }
});

interface SwitchProps
    extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
        VariantProps<typeof switchVariants> {
    label: React.ReactNode;
}

const SwitchBase = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
    ({ id: initialId, className, label, labelPosition, ...props }, ref) => {
        const id = generateId(initialId);

        return (
            <div className={cn(switchVariants({ labelPosition, className }))}>
                {label && <Label text={label} htmlFor={id} />}
                <SwitchPrimitives.Root
                    className={cn(
                        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                    )}
                    {...props}
                    ref={ref}
                    id={id}
                    aria-label={label ? String(label) : "Switch"}
                >
                    <SwitchPrimitives.Thumb
                        className={cn(
                            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
                        )}
                    />
                </SwitchPrimitives.Root>
            </div>
        );
    }
);
SwitchBase.displayName = SwitchPrimitives.Root.displayName;

const Switch = makeDecoratable("Switch", SwitchBase);

export { Switch, SwitchProps };
