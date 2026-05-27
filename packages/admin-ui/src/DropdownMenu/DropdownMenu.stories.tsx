import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { DropdownMenu } from "./DropdownMenu.js";
import { Button } from "~/Button/index.js";
import { ReactComponent as Cloud } from "@webiny/icons/cloud.svg";
import { ReactComponent as LogOut } from "@webiny/icons/logout.svg";
import { ReactComponent as LifeBuoy } from "@webiny/icons/safety_check.svg";
import { ReactComponent as CreditCard } from "@webiny/icons/credit_score.svg";
import { ReactComponent as Plus } from "@webiny/icons/add.svg";
import { ReactComponent as PlusCircle } from "@webiny/icons/add_circle.svg";
import { ReactComponent as Settings } from "@webiny/icons/settings.svg";
import { ReactComponent as Users } from "@webiny/icons/people.svg";
import { ReactComponent as UserPlus } from "@webiny/icons/person_add.svg";
import { ReactComponent as User } from "@webiny/icons/person.svg";
import { ReactComponent as Keyboard } from "@webiny/icons/keyboard.svg";
import { ReactComponent as Mail } from "@webiny/icons/mail.svg";
import { ReactComponent as MessageSquare } from "@webiny/icons/chat_bubble.svg";
import { ReactComponent as LinkIcon } from "@webiny/icons/link.svg";
import { Text } from "~/Text/index.js";

const meta: Meta<typeof DropdownMenu> = {
    title: "Components/Dropdown Menu",
    component: DropdownMenu,
    argTypes: {}
};

export default meta;

type Story = StoryObj<typeof DropdownMenu>;

const { Label, Separator, Group, Item, Link, CheckboxItem } = DropdownMenu;

export const Default: Story = {
    args: {
        trigger: <Button variant="primary" text={"Open"} />,
        children: (
            <>
                <Label text={"My Account"} />
                <Item icon={<Item.Icon label={"Profile"} element={<User />} />} text={"Profile"} />
                <Group>
                    <Item
                        icon={<Item.Icon element={<CreditCard />} label={"Billing"} />}
                        text={"Billing"}
                    />
                    <Item
                        icon={<Item.Icon element={<Settings />} label={"Settings"} />}
                        text={"Settings"}
                    />
                    <Item
                        icon={<Item.Icon element={<Keyboard />} label={"Keyboard shortcuts"} />}
                        text={"Keyboard shortcuts"}
                    />
                </Group>
                <Separator />
                <Group>
                    <Item icon={<Item.Icon element={<Users />} label={"Team"} />} text={"Team"} />
                    <Item
                        icon={<Item.Icon element={<UserPlus />} label={"Invite users"} />}
                        text={"Invite users"}
                    >
                        <Item
                            icon={<Item.Icon element={<Mail />} label={"Email"} />}
                            text={"Email"}
                        />
                        <Item
                            icon={<Item.Icon element={<MessageSquare />} label={"Message"} />}
                            text={"Message"}
                        />
                        <Separator />
                        <Item
                            icon={<Item.Icon label={"More..."} element={<PlusCircle />} />}
                            text={"More..."}
                        />
                    </Item>
                    <Item
                        icon={<Item.Icon label={"New Team"} element={<Plus />} />}
                        text={"New Team"}
                    />
                </Group>
                <Separator />
                <Item
                    icon={<Item.Icon label={"Support"} element={<LifeBuoy />} />}
                    text={"Support"}
                />
                <Item
                    icon={<Item.Icon label={"API"} element={<Cloud />} />}
                    text={"API"}
                    disabled
                />
                <Separator />
                <Item
                    icon={<Item.Icon label={"Log out"} element={<LogOut />} />}
                    text={"Log out"}
                />
                <Separator />
                <Label text={"Links"} />
                <Link
                    text={"Link 1"}
                    to={"#link-1"}
                    icon={<Link.Icon label="Link 1" element={<LinkIcon />} />}
                />
                <Link
                    text={"Link 2 (target: _blank)"}
                    to={"#link-2"}
                    icon={<Link.Icon label="Link 2" element={<LinkIcon />} />}
                    target={"_blank"}
                />
                <Link
                    text={"Link 3"}
                    to={"#link-3"}
                    icon={<Link.Icon label="Link 3" element={<LinkIcon />} />}
                />
            </>
        )
    },
    argTypes: {}
};

export const SimpleMenuWithIcons: Story = {
    args: {
        trigger: <Button variant="primary" text={"Open"} />,
        children: (
            <>
                <Item
                    icon={<Item.Icon label={"Billing"} element={<CreditCard />} />}
                    text={"Billing"}
                />
                <Item
                    icon={<Item.Icon label={"Settings"} element={<Settings />} />}
                    text={"Settings"}
                />
                <Item
                    icon={<Item.Icon label={"Keyboard shortcuts"} element={<Keyboard />} />}
                    text={"Keyboard shortcuts"}
                />
            </>
        )
    },
    argTypes: {}
};

export const WithSubMenus: Story = {
    args: {
        trigger: <Button variant="primary" text={"Open"} />,
        children: (
            <>
                <Label text={"My Account"} />
                <Item icon={<Item.Icon element={<User />} label={"Profile"} />} text={"Profile"} />
                <Group>
                    <Item
                        icon={<Item.Icon label={"Billing"} element={<CreditCard />} />}
                        text={"Billing"}
                    />
                    <Item
                        icon={<Item.Icon label={"Settings"} element={<Settings />} />}
                        text={"Settings"}
                    />
                    <Item
                        icon={<Item.Icon label={"Keyboard shortcuts"} element={<Keyboard />} />}
                        text={"Keyboard shortcuts"}
                    />
                </Group>
                <Separator />
                <Group>
                    <Item icon={<Item.Icon label={"Team"} element={<Users />} />} text={"Team"} />
                    <Item
                        icon={<Item.Icon label={"Invite user"} element={<UserPlus />} />}
                        text={"Invite users"}
                    >
                        <Item
                            icon={<Item.Icon label={"Email"} element={<Mail />} />}
                            text={"Email"}
                        />
                        <Item
                            icon={<Item.Icon label={"Message"} element={<MessageSquare />} />}
                            text={"Message"}
                        />
                        <Separator />
                        <Item
                            icon={<Item.Icon label={"More..."} element={<PlusCircle />} />}
                            text={"More..."}
                        >
                            <Item
                                icon={<Item.Icon label={"Email"} element={<Mail />} />}
                                text={"Email"}
                            />
                            <Item
                                icon={<Item.Icon label={"Message"} element={<MessageSquare />} />}
                                text={"Message"}
                            />
                            <Separator />
                            <Item
                                icon={<Item.Icon label={"More..."} element={<PlusCircle />} />}
                                text={"More..."}
                            />
                        </Item>
                    </Item>
                    <Item
                        icon={<Item.Icon label={"New Team"} element={<Plus />} />}
                        text={"New Team"}
                    />
                </Group>
                <Separator />
                <Item
                    icon={<Item.Icon label={"Support"} element={<LifeBuoy />} />}
                    text={"Support"}
                />
                <Item
                    icon={<Item.Icon label={"API"} element={<Cloud />} />}
                    text={"API"}
                    disabled
                />
                <Separator />
                <Item
                    icon={<Item.Icon label={"Log out"} element={<LogOut />} />}
                    text={"Log out"}
                />
            </>
        )
    },
    argTypes: {}
};

const TARGET_LEVELS = [
    {
        id: "viewer",
        label: "Viewer",
        description: "Can view content, but not modify it"
    },
    {
        id: "editor",
        label: "Editor",
        description: "Can view and modify content"
    },
    {
        id: "owner",
        label: "Owner",
        description: "Can edit and manage content permissions"
    }
];

export const WithCheckboxItems: Story = {
    args: {
        trigger: <Button variant="primary" text={"Open"} />,
        children: (
            <>
                {TARGET_LEVELS.map(level => (
                    <CheckboxItem
                        key={level.id}
                        checked={level.id === "viewer"}
                        text={
                            <div>
                                <Text as={"div"}>{level.label}</Text>
                                <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                                    {level.description}
                                </Text>
                            </div>
                        }
                        onClick={() => {
                            console.log("Selected level:", level.id);
                        }}
                    />
                ))}
                <DropdownMenu.Separator />
                <DropdownMenu.Item text={"Remove access"} />
            </>
        )
    },
    argTypes: {}
};

export const WithOnOpenChange: Story = {
    args: {
        trigger: <Button variant="primary" text={"Open"} />,
        onOpenChange: opened => {
            console.log(`Menu is ${opened ? "opened" : "closed"}.`);
        },
        children: (
            <>
                <Item
                    icon={<Item.Icon element={<CreditCard />} label={"Billing"} />}
                    text={"Billing"}
                />
                <Item
                    icon={<Item.Icon element={<Settings />} label={"Settings"} />}
                    text={"Settings"}
                />
                <Item
                    icon={<Item.Icon element={<Keyboard />} label={"Keyboard shortcuts"} />}
                    text={"Keyboard shortcuts"}
                />
            </>
        )
    },
    argTypes: {}
};

export const Documentation: Story = {
    args: {
        trigger: <Button variant="primary" text={"Open"} />,
        children: (
            <>
                <Label text={"My Account"} />
                <Item icon={<Item.Icon label={"Profile"} element={<User />} />} text={"Profile"} />
                <Group>
                    <Item
                        icon={<Item.Icon element={<CreditCard />} label={"Billing"} />}
                        text={"Billing"}
                    />
                    <Item
                        icon={<Item.Icon element={<Settings />} label={"Settings"} />}
                        text={"Settings"}
                    />
                    <Item
                        icon={<Item.Icon element={<Keyboard />} label={"Keyboard shortcuts"} />}
                        text={"Keyboard shortcuts"}
                    />
                </Group>
                <Separator />
                <Group>
                    <Item icon={<Item.Icon element={<Users />} label={"Team"} />} text={"Team"} />
                    <Item
                        icon={<Item.Icon element={<UserPlus />} label={"Invite users"} />}
                        text={"Invite users"}
                    >
                        <Item
                            icon={<Item.Icon element={<Mail />} label={"Email"} />}
                            text={"Email"}
                        />
                        <Item
                            icon={<Item.Icon element={<MessageSquare />} label={"Message"} />}
                            text={"Message"}
                        />
                        <Separator />
                        <Item
                            icon={<Item.Icon label={"More..."} element={<PlusCircle />} />}
                            text={"More..."}
                        />
                    </Item>
                    <Item
                        icon={<Item.Icon label={"New Team"} element={<Plus />} />}
                        text={"New Team"}
                    />
                </Group>
                <Separator />
                <Item
                    icon={<Item.Icon label={"Support"} element={<LifeBuoy />} />}
                    text={"Support"}
                />
                <Item
                    icon={<Item.Icon label={"API"} element={<Cloud />} />}
                    text={"API"}
                    disabled
                />
                <Separator />
                <Item
                    icon={<Item.Icon label={"Log out"} element={<LogOut />} />}
                    text={"Log out"}
                />
                <Separator />
                <Label text={"Links"} />
                <Link
                    text={"Link 1"}
                    to={"#link-1"}
                    icon={<Link.Icon label="Link 1" element={<LinkIcon />} />}
                />
                <Link
                    text={"Link 2"}
                    to={"#link-2"}
                    icon={<Link.Icon label="Link 2" element={<LinkIcon />} />}
                />
                <Link
                    text={"Link 3"}
                    to={"#link-3"}
                    icon={<Link.Icon label="Link 3" element={<LinkIcon />} />}
                />
            </>
        )
    },
    argTypes: {
        trigger: {
            description:
                "The trigger element that opens the menu. Please refer to the example code for details."
        },
        children: {
            description: "The content of the menu. Please refer to the example code for details."
        }
    }
};
