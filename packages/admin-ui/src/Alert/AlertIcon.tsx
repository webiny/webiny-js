import * as React from "react";
import { cva } from "~/utils.js";
import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";
import { ReactComponent as WarningIcon } from "@webiny/icons/warning_amber.svg";
import { ReactComponent as SuccessIcon } from "@webiny/icons/check_circle.svg";
import { useAlertProps } from "./AlertPropsProvider.js";
import { Icon } from "~/Icon/Icon.js";

const VARIANT_ICON_MAP = {
    info: InfoIcon,
    success: SuccessIcon,
    warning: InfoIcon,
    danger: WarningIcon
};

const alertIconVariants = cva("size-md", {
    variants: {
        type: { info: "", success: "", warning: "", danger: "" },
        variant: { strong: "", subtle: "" }
    },
    defaultVariants: {
        type: "info",
        variant: "subtle"
    },
    compoundVariants: [
        { type: "info", variant: "strong", className: "fill-neutral-base" },
        { type: "info", variant: "subtle", className: "fill-neutral-xstrong" },
        { type: "success", variant: "strong", className: "fill-neutral-base" },
        { type: "success", variant: "subtle", className: "fill-success" },
        { type: "warning", variant: "strong", className: "fill-neutral-xstrong" },
        { type: "warning", variant: "subtle", className: "fill-warning" },
        { type: "danger", variant: "strong", className: "fill-neutral-base" },
        { type: "danger", variant: "subtle", className: "fill-destructive" }
    ]
});

export const AlertIcon = () => {
    const { icon, type, variant } = useAlertProps();
    if (icon === null) {
        return null;
    }

    let iconElement = icon;
    if (!iconElement) {
        const IconComponent = VARIANT_ICON_MAP[type || "info"];
        iconElement = <IconComponent />;
    }

    return (
        <div className={"py-xs"}>
            <Icon
                label={"Alert icon"}
                icon={iconElement}
                className={alertIconVariants({ type, variant })}
            />
        </div>
    );
};
