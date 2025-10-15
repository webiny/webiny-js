import React from "react";
import { IconButton } from "@webiny/admin-ui";
import { useSecurity } from "@webiny/app-security";
import { ReactComponent as KeyboardArrowRightIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { UserMenuHandleRenderer as UserMenuHandleRendererSpec } from "@webiny/app-admin";
import { UserImage } from "./UserImage.js";

export const UserMenuHandle = UserMenuHandleRendererSpec.createDecorator(() => {
    return function UserMenuHandle() {
        const { identity } = useSecurity();

        if (!identity) {
            return null;
        }

        return (
            <div className={"wby-flex wby-gap-x-sm wby-cursor-pointer"}>
                <div
                    data-testid="logged-in-user-menu-avatar"
                    className={
                        "wby-flex wby-items-center wby-rounded-md wby-gap-xxs wby-py-xs wby-px-xs wby-bg-neutral-light"
                    }
                >
                    <UserImage />
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
