import React from "react";
import { cn, cva, type VariantProps } from "~/utils.js";
import { ProgressItemState } from "~/SteppedProgress/domains/index.js";

const steppedProgressIndicatorVariants = cva(
    ["size-lg rounded-full relative shrink-0 basis-auto"],
    {
        variants: {
            state: {
                [ProgressItemState.IDLE]:
                    "bg-neutral-base border-sm border-solid border-neutral-muted",
                [ProgressItemState.IN_PROGRESS]: [
                    "bg-primary-base border-sm border-solid border-neutral-muted"
                ],
                [ProgressItemState.COMPLETED]: "bg-primary",
                [ProgressItemState.COMPLETED_AFFIRMATIVE]: "bg-success-default"
            },
            disabled: {
                true: "bg-neutral-dimmed! border-none!"
            },
            errored: {
                true: ""
            }
        },
        compoundVariants: [
            {
                state: ProgressItemState.COMPLETED,
                errored: true,
                className: "bg-destructive-default"
            }
        ],
        defaultVariants: {
            state: ProgressItemState.IDLE
        }
    }
);

interface SteppedProgressIndicatorProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof steppedProgressIndicatorVariants> {}

const SteppedProgressIndicator = ({
    state,
    disabled,
    errored,
    className,
    children,
    ...props
}: SteppedProgressIndicatorProps) => {
    return (
        <div
            {...props}
            className={cn(
                steppedProgressIndicatorVariants({ state, disabled, errored }),
                className
            )}
        >
            {children}
        </div>
    );
};

export { SteppedProgressIndicator, type SteppedProgressIndicatorProps };
