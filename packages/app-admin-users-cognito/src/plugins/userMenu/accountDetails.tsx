import React, { useCallback } from "react";
import { css } from "emotion";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { Link } from "@webiny/react-router";
import { ReactComponent as AccountIcon } from "~/assets/icons/round-account_circle-24px.svg";
import { ReactComponent as LogoutIcon } from "~/assets/icons/logout_black_24dp.svg";
import { useSecurity } from "@webiny/app-security";
import { useTenancy } from "@webiny/app-tenancy";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";

const linkStyles = css({
    "&:hover": {
        textDecoration: "none"
    }
});

export const AccountDetails: React.FC = () => {
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

    if (!security.identity.profile) {
        return null;
    }

    return (
        <Link to={"/account"} className={linkStyles}>
            <ListItem>
                <ListItemGraphic>
                    <Icon icon={<AccountIcon />} />
                </ListItemGraphic>
                Account details
            </ListItem>
        </Link>
    );
};

export default () => {
    console.log(
        `[DEPRECATED] Import "@webiny/app-admin-users-cognito/plugins/userMenu/accountDetails" is no longer used!`
    );
    return { type: "dummy" };
};
