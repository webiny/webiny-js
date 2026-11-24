import React from "react";
import { makeDecoratable } from "@webiny/app";
import { Button, Heading, Text } from "@webiny/admin-ui";

export interface LoginNoTenantAccessProps {
    onSignOut: () => void;
}

/**
 * Shown after sign-in when the user can't access any tenant. It renders only the content:
 * each login screen puts it in its own layout.
 */
export const LoginNoTenantAccess = makeDecoratable(
    "LoginNoTenantAccess",
    ({ onSignOut }: LoginNoTenantAccessProps) => {
        return (
            <div data-testid={"login-no-tenant-access"}>
                <div className={"mb-md"}>
                    <Heading level={4}>No access</Heading>
                    <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                        You don&apos;t have access to any tenant. Ask an administrator to add you,
                        or sign in with a different account.
                    </Text>
                </div>
                <div className={"flex flex-row-reverse"}>
                    <Button text={"Sign out"} onClick={onSignOut} />
                </div>
            </div>
        );
    }
);
