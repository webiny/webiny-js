import React from "react";
import { Avatar, IconButton } from "@webiny/admin-ui";
import { useSecurity } from "@webiny/app-security";
import { ReactComponent as KeyboardArrowRightIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { UserMenuHandleRenderer as UserMenuHandleRendererSpec } from "@webiny/app-admin";

export const UserMenuHandle = UserMenuHandleRendererSpec.createDecorator(() => {
    return function UserMenuHandle() {
        const { identity } = useSecurity();

        if (!identity) {
            return null;
        }

        const profile = identity.profile;

        const { firstName, lastName, avatar } = profile || {};
        const fullName = `${firstName} ${lastName}`;

        return (
            <div className={"flex gap-x-sm cursor-pointer"}>
                <div
                    data-testid="logged-in-user-menu-avatar"
                    className={"flex items-center rounded-md gap-xxs py-xs px-xs bg-neutral-light"}
                >
                    <Avatar
                        size={"sm"}
                        variant={"strong"}
                        image={<Avatar.Image src={avatar?.src} />}
                        fallback={
                            <Avatar.Fallback className={"uppercase"} delayMs={0}>
                                {fullName[0]}
                            </Avatar.Fallback>
                        }
                    />
                    <IconButton
                        variant={"ghost"}
                        size={"xs"}
                        color={"neutral-strong"}
                        icon={<KeyboardArrowRightIcon />}
                    />
                </div>
            </div>
        );
    };
});
