import * as React from "react";
import { useMemo } from "react";
import { cn, cva, makeDecoratable, type VariantProps, withStaticProps } from "~/utils.js";
import { Button, type ButtonProps } from "~/Button/index.js";
import { AlertIcon } from "./AlertIcon.js";
import { AlertSwatchBox } from "./AlertSwatchBox.js";
import { AlertPropsProvider, useAlertProps } from "./AlertPropsProvider.js";
import { AlertCloseButton } from "./AlertCloseButton.js";
import { defaultVariants } from "./constants.js";

const alertVariants = cva(
    "flex gap-sm-plus items-start w-full rounded-lg text-md py-sm-extra pl-md pr-sm-plus [&_a]:font-semibold [&_a]:underline",
    {
        variants: {
            type: { info: "", success: "", warning: "", danger: "" },
            variant: { strong: "", subtle: "" }
        },
        defaultVariants,
        compoundVariants: [
            {
                type: "info",
                variant: "strong",
                className: "bg-neutral-dark text-neutral-light [&_a]:text-neutral-light!"
            },
            {
                type: "info",
                variant: "subtle",
                className: "bg-neutral-dimmed text-neutral-primary [&_a]:text-neutral-primary!"
            },
            {
                type: "success",
                variant: "strong",
                className: "bg-secondary text-neutral-light [&_a]:text-neutral-light!"
            },
            {
                type: "success",
                variant: "subtle",
                className: "bg-success-subtle text-neutral-primary [&_a]:text-neutral-primary!"
            },
            {
                type: "warning",
                variant: "strong",
                className: "bg-warning text-neutral-primary [&_a]:text-neutral-primary!"
            },
            {
                type: "warning",
                variant: "subtle",
                className: "bg-warning-subtle text-neutral-primary [&_a]:text-neutral-primary!"
            },
            {
                type: "danger",
                variant: "strong",
                className: "bg-destructive text-neutral-light [&_a]:text-neutral-light!"
            },
            {
                type: "danger",
                variant: "subtle",
                className: "bg-destructive-subtle text-neutral-primary [&_a]:text-neutral-primary!"
            }
        ]
    }
);

export interface AlertProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof alertVariants> {
    showCloseButton?: boolean;
    icon?: React.ReactElement | null;
    onClose?: () => void;
    actions?: React.ReactElement<typeof AlertAction>;
    swatchColor?: string;
    swatchColorIcon?: boolean;
}

const AlertActionBase = (props: ButtonProps) => {
    const { variant: alertVariant } = useAlertProps();
    return (
        <Button
            text={"Button"}
            variant={alertVariant === "strong" ? "secondary" : "tertiary"}
            size={"sm"}
            {...props}
        />
    );
};

const AlertAction = makeDecoratable("AlertAction", AlertActionBase);

const AlertBase = (props: AlertProps) => {
    const { className, type, variant, swatchColor, actions, children, ...rootRestProps } = props;

    const backgroundColor = useMemo(() => {
        if (!swatchColor) {
            return;
        }

        return swatchColor + "66";
    }, [swatchColor]);

    return (
        <AlertPropsProvider props={props}>
            <div
                role="alert"
                className={cn(alertVariants({ type, variant }), className)}
                style={{ backgroundColor }}
                {...rootRestProps}
            >
                <AlertSwatchBox />
                <AlertIcon />
                <div className={"grow py-xxs"}>{children}</div>
                {actions && <div className={"flex gap-sm"}>{actions}</div>}
                <AlertCloseButton />
            </div>
        </AlertPropsProvider>
    );
};

const Alert = withStaticProps(makeDecoratable("AlertBase", AlertBase), {
    Action: AlertAction
});

export { Alert };
