import * as React from "react";
import { IconButton } from "~/Button/index.js";
import { ReactComponent as XIcon } from "@webiny/icons/close.svg";
import { Icon } from "~/Icon/index.js";
import { useAlertProps } from "./AlertPropsProvider.js";
import { useMemo } from "react";
import { DEFAULT_TYPE, DEFAULT_VARIANT } from "./constants.js";

export const AlertCloseButton = () => {
    const {
        showCloseButton,
        onClose,
        type = DEFAULT_TYPE,
        variant = DEFAULT_VARIANT
    } = useAlertProps();

    if (!showCloseButton) {
        return null;
    }

    const iconButtonVariant = useMemo(() => {
        if (variant === "subtle") {
            return "ghost";
        }

        if (type === "warning") {
            return "ghost";
        }

        return "ghost-negative";
    }, [type, variant]);

    return (
        <IconButton
            onClick={onClose}
            icon={<Icon icon={<XIcon />} label="Close" />}
            size={"sm"}
            variant={iconButtonVariant}
        />
    );
};
