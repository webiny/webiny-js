import React from "react";
import { makeDecoratable } from "~/index.js";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";
import { MenuItem } from "./Menu/MenuItem.js";
import { MenuLink } from "./Menu/MenuLink.js";
import { MenuGroup } from "./Menu/MenuGroup.js";
import { SupportMenu } from "./Menu/SupportMenu.js";
import { UserMenu } from "./Menu/UserMenu.js";

export interface MenuProps {
    name: string;
    parent?: string | null;
    tags?: string[];
    element?: React.ReactElement;
    remove?: boolean;
    pin?: "start" | "end";
    before?: string;
    after?: string;
    pinnable?: boolean;
}

export type MenuConfig = Pick<MenuProps, "name" | "parent" | "tags" | "element" | "pinnable">;

const BaseMenu = ({
    name,
    parent = null,
    tags = [],
    element,
    remove,
    pin,
    before,
    after,
    pinnable = false
}: MenuProps) => {
    const getId = useIdGenerator("Menu");

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
                name={"menus"}
                remove={remove}
                array={true}
                before={placeBefore}
                after={placeAfter}
            >
                <Property id={getId(name, "name")} name={"name"} value={name} />
                <Property id={getId(name, "parent")} name={"parent"} value={parent} />
                <Property id={getId(name, "tags")} name={"tags"} value={tags} />
                <Property id={getId(name, "element")} name={"element"} value={element} />
                <Property id={getId(name, "pinnable")} name={"pinnable"} value={pinnable} />
            </Property>
        </ConnectToProperties>
    );
};

const DecoratableMenu = makeDecoratable("Menu", BaseMenu);

const BaseFooterMenu = ({ tags, ...props }: MenuProps) => {
    return <BaseMenu {...props} tags={["footer", ...(tags || [])]} />;
};

const DecoratableFooterMenu = makeDecoratable("FooterMenu", BaseFooterMenu);

export const Menu = Object.assign(DecoratableMenu, {
    Item: MenuItem,
    Link: MenuLink,
    Group: MenuGroup,
    Footer: DecoratableFooterMenu,
    Support: SupportMenu,
    User: UserMenu
});
