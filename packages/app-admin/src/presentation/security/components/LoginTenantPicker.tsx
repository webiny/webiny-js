import React from "react";
import { makeDecoratable } from "@webiny/app";
import { Button, Heading, Link, Text } from "@webiny/admin-ui";
import type { Tenant } from "~/features/tenancy/abstractions.js";

export interface LoginTenantPickerProps {
    tenants: Tenant[];
    onSelect: (tenantId: string) => void;
    onSignOut: () => void;
}

/**
 * Shown after sign-in when the user can access several tenants. It renders only the content:
 * each login screen puts it in its own layout.
 */
export const LoginTenantPicker = makeDecoratable(
    "LoginTenantPicker",
    ({ tenants, onSelect, onSignOut }: LoginTenantPickerProps) => {
        return (
            <div data-testid={"login-tenant-picker"}>
                <div className={"mb-md"}>
                    <Heading level={4}>Select a tenant</Heading>
                    <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                        Your account has access to several tenants. Pick the one to open.
                    </Text>
                </div>
                <div className={"flex flex-col gap-sm"}>
                    {tenants.map(tenant => (
                        <Button
                            key={tenant.id}
                            variant={"tertiary"}
                            text={tenant.name}
                            className={"w-full justify-start"}
                            onClick={() => onSelect(tenant.id)}
                        />
                    ))}
                </div>
                <Text as={"div"} size={"sm"} className={"mt-md"}>
                    <Link to="#" onClick={onSignOut}>
                        Sign out
                    </Link>
                </Text>
            </div>
        );
    }
);
