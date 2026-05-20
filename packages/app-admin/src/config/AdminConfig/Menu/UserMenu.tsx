import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";
import { UserMenuItem } from "./UserMenu/UserMenuItem.js";
import { UserMenuLink } from "./UserMenu/UserMenuLink.js";
import { UserMenuSeparator } from "./UserMenu/UserMenuSeparator.js";

export interface UserMenuProps {
    name: string;
    parent?: string | null;
    tags?: string[];
    element?: React.ReactElement;
    remove?: boolean;
    pin?: "start" | "end";
    before?: string;
    after?: string;
}

export type UserMenuConfig = Pick<UserMenuProps, "name" | "parent" | "tags" | "element">;

const BaseUserMenu = ({
    name,
    parent = null,
    tags = [],
    element,
    remove,
    pin,
    before,
    after
}: UserMenuProps) => {
    const getId = useIdGenerator("UserMenu");

    let placeAfter = after !== undefined ? getId(after) : undefined;
    let placeBefore = before !== undefined ? getId(before) : undefined;
    if (pin) {
        if (pin === "start") {
            placeBefore = "$first";
        } else {
            placeAfter = "$last";
        }
    }

    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property
                id={getId(name)}
                name={"userMenus"}
                remove={remove}
                array={true}
                before={placeBefore}
                after={placeAfter}
            >
                <Property id={getId(name, "name")} name={"name"} value={name} />
                <Property id={getId(name, "parent")} name={"parent"} value={parent} />
                <Property id={getId(name, "tags")} name={"tags"} value={tags} />
                <Property id={getId(name, "element")} name={"element"} value={element} />
            </Property>
        </ConnectToProperties>
    );
};

const DecoratableUserMenu = makeDecoratable("UserMenu", BaseUserMenu);

export const UserMenu = Object.assign(DecoratableUserMenu, {
    Item: UserMenuItem,
    Link: UserMenuLink,
    Separator: UserMenuSeparator
});
