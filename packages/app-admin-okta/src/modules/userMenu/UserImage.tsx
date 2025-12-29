import React from "react";
import { makeDecoratable } from "@webiny/app-serverless-cms";
import { Avatar } from "@webiny/admin-ui";
import { useIdentity } from "@webiny/app-admin";

export const UserImage = makeDecoratable("UserImage", () => {
    const { identity } = useIdentity();

    return (
        <Avatar
            size={"sm"}
            variant={"strong"}
            fallback={
                <Avatar.Fallback className={"uppercase"} delayMs={0}>
                    {identity.displayName[0]}
                </Avatar.Fallback>
            }
        />
    );
});
