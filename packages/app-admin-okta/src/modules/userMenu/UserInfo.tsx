import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { Text } from "@webiny/admin-ui";
import { useSecurity } from "@webiny/app-security";

const { Menu } = AdminConfig;

export const UserInfo = () => {
    const security = useSecurity();
    if (!security || !security.identity) {
        return null;
    }

    const { id, displayName } = security.identity;

    return (
        <>
            <Text size={"md"} className={"block font-semibold mb-sm"}>
                {displayName}
            </Text>
            <Text size={"sm"} className={"block !text-neutral-strong"}>
                {id}
            </Text>
            <Menu.User.Separator />
        </>
    );
};
