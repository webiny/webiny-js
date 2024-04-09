import React from "react";
import { css } from "emotion";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { Link } from "@webiny/react-router";
import { ReactComponent as AccountIcon } from "~/assets/icons/round-account_circle-24px.svg";
import { ReactComponent as LogoutIcon } from "~/assets/icons/logout_black_24dp.svg";
import { useSecurity } from "@webiny/app-security";
import { useTenancy } from "@webiny/app-tenancy";
import { useIsDefaultTenant } from "./useIsDefaultTenant";

const linkStyles = css({
    "&:hover": {
        textDecoration: "none"
    }
});

interface AccountDetailsProps {
    accountRoute: `/${string}`;
}

export const AccountDetails = ({ accountRoute }: AccountDetailsProps) => {
    const security = useSecurity();
    const tenancy = useTenancy();
    const isDefaultTenant = useIsDefaultTenant();

    if (!security || !security.identity) {
        return null;
    }

    // This is only applicable in multi-tenant environments
    const { defaultTenant } = security.identity;

    if (tenancy && !isDefaultTenant) {
        return (
            <ListItem onClick={() => tenancy.setTenant(defaultTenant.id)}>
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
        <Link to={accountRoute} className={linkStyles}>
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
