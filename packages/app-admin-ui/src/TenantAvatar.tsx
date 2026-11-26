import React from "react";
import { TenantSwitcherPresenter } from "@webiny/app-admin";
import { useAdminConfig } from "@webiny/app-admin";
import { Avatar } from "@webiny/admin-ui";
import type { AvatarImageProps } from "@webiny/admin-ui";
import { Sidebar } from "@webiny/admin-ui";

interface TenantAvatarProps {
    tenant: TenantSwitcherPresenter.Tenant;
}

/**
 * A tenant's logo, 24px. Root shows the admin's own logo; any other tenant shows its uploaded
 * logo, or its initials when it has none, never the root's logo.
 */
export const TenantAvatar = ({ tenant }: TenantAvatarProps) => {
    const { logo, title } = useAdminConfig();

    if (tenant.isRoot) {
        return <Sidebar.Icon element={logo.squareLogo} label={title} />;
    }

    // While the logo loads, the initials wait a moment so they don't flash.
    let image: React.ReactElement<AvatarImageProps> | undefined;
    let fallbackDelayMs = 0;
    if (tenant.logo) {
        image = <Avatar.Image src={tenant.logo} alt={tenant.name} />;
        fallbackDelayMs = 600;
    }

    return (
        <Avatar
            size={"sm"}
            variant={"strong"}
            className={"shrink-0"}
            image={image}
            fallback={
                <Avatar.Fallback delayMs={fallbackDelayMs}>{tenant.initials}</Avatar.Fallback>
            }
        />
    );
};
