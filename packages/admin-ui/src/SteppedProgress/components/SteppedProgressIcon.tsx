import React from "react";
import { ReactComponent as CheckIcon } from "@webiny/icons/check.svg";
import { ReactComponent as ErrorIcon } from "@webiny/icons/error_outline.svg";
import { cn, cva, type VariantProps } from "~/utils.js";
import { ProgressItemState } from "~/SteppedProgress/domains/index.js";
import { Icon } from "~/Icon/index.js";

const steppedProgressIconVariants = cva(
    ["absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"],
    {
        variants: {
            state: {
                [ProgressItemState.IDLE]: "hidden",
                [ProgressItemState.IN_PROGRESS]:
                    "size-sm-extra rounded-full bg-primary-default",
                [ProgressItemState.COMPLETED]: "fill-neutral-base",
                [ProgressItemState.COMPLETED_AFFIRMATIVE]: "fill-neutral-base"
            },
            disabled: {
                true: "fill-neutral-base!"
            },
            errored: {
                true: "fill-destructive"
            }
        },
        compoundVariants: [
            // disabled
            {
                state: ProgressItemState.IN_PROGRESS,
                disabled: true,
                className: "bg-neutral-strong"
            },
            // errored
            {
                state: ProgressItemState.IDLE,
                errored: true,
                className: "block"
            },
            {
                state: ProgressItemState.IN_PROGRESS,
                errored: true,
                className: "size-auto rounded-none bg-transparent"
            },
            {
                state: ProgressItemState.COMPLETED,
                errored: true,
                className: "fill-neutral-base"
            },
            {
                state: ProgressItemState.COMPLETED_AFFIRMATIVE,
                errored: true,
                className: "fill-neutral-base"
            }
        ],
        defaultVariants: {
            state: ProgressItemState.IDLE
        }
    }
);

interface SteppedProgressIconProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof steppedProgressIconVariants> {}

const SteppedProgressIcon = ({
    state,
    errored,
    disabled,
    className,
    ...props
}: SteppedProgressIconProps) => {
    const icon = React.useMemo(() => {
        if (errored) {
            return <Icon icon={<ErrorIcon />} label={"Error"} size={"sm"} />;
        }

        if (
            state === ProgressItemState.COMPLETED ||
            state === ProgressItemState.COMPLETED_AFFIRMATIVE
        ) {
            return <Icon icon={<CheckIcon />} label={"Completed"} size={"sm"} />;
        }

        return <></>;
    }, [state, errored]);

    return (
        <div
            {...props}
            className={cn(steppedProgressIconVariants({ state, disabled, errored }), className)}
        >
            {icon}
        </div>
    );
};

export { SteppedProgressIcon, type SteppedProgressIconProps };
