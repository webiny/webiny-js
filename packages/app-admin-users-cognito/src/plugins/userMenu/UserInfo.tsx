import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { Text } from "@webiny/admin-ui";
import { useSecurity } from "@webiny/app-admin";
import { useIsDefaultTenant } from "~/plugins/userMenu/useIsDefaultTenant.js";

const { Menu } = AdminConfig;

interface UserInfoProps {
    accountRoute?: string;
}

export const UserInfo = ({ accountRoute }: UserInfoProps) => {
    const security = useSecurity();
    const isDefaultTenant = useIsDefaultTenant();

    if (!security || !security.identity) {
        return null;
    }

    const { profile, displayName } = security.identity;

    // Start with the assumption that the user doesn't have a profile in the system (external IDP).
    let content = (
        <Text size={"md"} className={"font-bold"}>
            {displayName}
        </Text>
    );

    if (profile) {
        const { email, firstName, lastName } = profile;
        const fullName = `${firstName} ${lastName}`;

        content = (
            <>
                <Text size={"md"} className={"block font-semibold mb-sm"}>
                    {fullName}
                </Text>

                <Text size={"sm"} className={"block text-neutral-strong!"}>
                    {email}
                </Text>
            </>
        );
    }

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
