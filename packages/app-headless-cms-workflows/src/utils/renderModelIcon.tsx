import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Icon } from "@webiny/admin-ui";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { normalizeIcon } from "@webiny/app-headless-cms/utils/normalizeIcon.js";

/*
 * The icon of a content model, drawn from `CmsModel.icon`. A model without a usable icon gets
 * `null`, so each caller picks its own fallback.
 */
export const renderModelIcon = (model: Pick<CmsModel, "name" | "icon">): React.ReactNode => {
    const icon = normalizeIcon(model.icon);
    if (!icon) {
        return null;
    }

    return (
        <Icon
            icon={<FontAwesomeIcon icon={icon} />}
            label={model.name}
            size="sm"
            color="neutral-light"
        />
    );
};
