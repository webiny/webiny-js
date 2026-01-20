import React, { type ReactElement } from "react";
import { useAdminConfig } from "~/config/AdminConfig.js";

export const SupportMenuItems = (): ReactElement | null => {
    const { supportMenus } = useAdminConfig();
    // @ts-expect-error Fix with React 19.
    return supportMenus.map(menu => {
        if (!React.isValidElement(menu.element)) {
            return null;
        }

        return React.cloneElement(menu.element, { key: menu.name });
    });
};
