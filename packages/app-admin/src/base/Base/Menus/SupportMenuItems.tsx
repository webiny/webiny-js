import React, { type ReactElement } from "react";
import { AdminConfig } from "~/config/AdminConfig.js";

const { useAdminConfig } = AdminConfig;

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
