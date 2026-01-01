import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { useSecurity } from "@webiny/app-admin";
import { Avatar } from "@webiny/admin-ui";

export const UserImage = makeDecoratable("UserImage", () => {
    const { identity } = useSecurity();

    const { displayName } = identity;

    return (
        <Avatar
            size={"sm"}
            variant={"strong"}
            fallback={
                <Avatar.Fallback className={"uppercase"} delayMs={0}>
                    {displayName[0]}
                </Avatar.Fallback>
            }
        />
    );
});
