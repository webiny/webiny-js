import React, { useCallback } from "react";
import { makeComposable } from "@webiny/app-serverless-cms";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as LogoutIcon } from "~/assets/icons/logout_black_24dp.svg";
import { useSecurity } from "@webiny/app-security";
import { useTenancy } from "@webiny/app-tenancy";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";

export const ExitTenant = makeComposable("ExitTenant", () => {
    const security = useSecurity();
    const tenancy = useTenancy();
    const i18n = useI18N();

    if (!security || !security.identity) {
        return null;
    }

    // This is only applicable in multi-tenant environments
    const { currentTenant, defaultTenant } = security.identity;

    const exitTenant = useCallback(() => {
        tenancy.setTenant(defaultTenant.id);
        i18n.setCurrentLocale("", "content");
    }, [defaultTenant]);

    if (tenancy && currentTenant && defaultTenant && currentTenant.id !== defaultTenant.id) {
        return (
            <ListItem onClick={exitTenant}>
                <ListItemGraphic>
                    <Icon icon={<LogoutIcon />} />
                </ListItemGraphic>
                Exit tenant
            </ListItem>
        );
    }

    return null;
});
