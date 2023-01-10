import React from "react";
import { makeComposable } from "@webiny/app-serverless-cms";
import { Avatar } from "@webiny/ui/Avatar";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";

export const UserImage = makeComposable("UserImage", () => {
    const { identity } = useSecurity();

    if (!identity) {
        return null;
    }

    const { displayName } = identity;

    return (
        <Avatar
            data-testid="logged-in-user-menu-avatar"
            alt={displayName}
            fallbackText={displayName}
        />
    );
});
