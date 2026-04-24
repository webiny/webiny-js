import React from "react";
import { Text } from "@webiny/admin-ui";
import { useAuthentication } from "~/presentation/security/hooks/useAuthentication.js";
import { Menu } from "~/config/AdminConfig/Menu.js";

interface UserInfoProps {
    accountRoute?: string;
}

export const UserInfo = ({ accountRoute }: UserInfoProps) => {
    const { identity } = useAuthentication();

    if (!identity.isAuthenticated) {
        return null;
    }

    const isDefaultTenant = identity.defaultTenant.id === identity.currentTenant.id;

    const { email, firstName, lastName } = identity.profile;
    let fullName = `${firstName} ${lastName}`;
    if (fullName.trim() === "") {
        fullName = identity.displayName;
    }

    const content = (
        <>
            <Text size={"md"} className={"block font-semibold mb-xs"}>
                {fullName}
            </Text>

            <Text size={"sm"} className={"block text-neutral-strong!"}>
                {email}
            </Text>
        </>
    );

    let listItem = <Menu.User.Item text={content} />;
    if (accountRoute && isDefaultTenant) {
        listItem = <Menu.User.Link text={content} to={accountRoute} />;
    }

    return (
        <>
            {listItem}
            <Menu.User.Separator />
        </>
    );
};
