import React from "react";
import { Icon } from "@webiny/admin-ui";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { ReactComponent as DevicesOtherIcon } from "@webiny/icons/devices_other.svg";
import { renderModelIcon } from "./renderModelIcon.js";

/*
 * The icon of a content model, or the generic `devices_other` icon for a model without a usable
 * icon (or no model at all, labelled with `fallbackLabel`).
 */
export const renderModelIconOrFallback = (
    model: Pick<CmsModel, "name" | "icon"> | undefined,
    fallbackLabel: string
): React.ReactNode => {
    const icon = model ? renderModelIcon(model) : null;
    if (icon) {
        return icon;
    }

    return (
        <Icon
            icon={<DevicesOtherIcon />}
            label={model?.name ?? fallbackLabel}
            size="sm"
            color="neutral-light"
        />
    );
};
