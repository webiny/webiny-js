import React from "react";
import { Avatar } from "@webiny/ui/Avatar";
import { Image } from "@webiny/app/components";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";
import { AdminHeaderUserMenuHandlePlugin } from "@webiny/app-admin/types";

const UserImage = () => {
    const { identity } = useSecurity();

    if (!identity) {
        return null;
    }

    const { fullName, avatar, gravatar } = identity;

    return (
        <Avatar
            data-testid="logged-in-user-menu-avatar"
            src={avatar ? avatar.src : gravatar}
            alt={fullName}
            fallbackText={fullName}
            renderImage={props => <Image {...props} transform={{ width: 100 }} />}
        />
    );
};

export default (): AdminHeaderUserMenuHandlePlugin => {
    return {
        name: "admin-header-user-menu-handle",
        type: "admin-header-user-menu-handle",
        render() {
            return <UserImage />;
        }
    };
};
