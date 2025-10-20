import React from "react";
import { ReactComponent as ChartIcon } from "@webiny/icons/insert_chart.svg";
import { ReactComponent as MoreIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as OpenIcon } from "@webiny/icons/visibility.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as TrashIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as UserIcon } from "@webiny/icons/person.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { ReactComponent as HelpIcon } from "@webiny/icons/help.svg";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { List, type ListItemProps as BaseListItemProps } from "./List.js";
import { Avatar } from "~/Avatar/index.js";

const meta: Meta<typeof List> = {
    title: "Components/List",
    component: List,
    parameters: {
        layout: "padded"
    }
};

export default meta;

type Story = StoryObj<typeof List>;

interface ListItemProps extends Omit<BaseListItemProps, "title"> {
    index: number;
}

const ListItem = (props: ListItemProps) => {
    return <List.Item title={`List item ${props.index}`} {...props} />;
};

export const Default: Story = {
    args: {
        children: (
            <>
                <ListItem index={1} />
                <ListItem index={2} />
                <ListItem index={3} />
            </>
        )
    }
};

export const WithTransparentBackground: Story = {
    args: {
        background: "transparent",
        children: (
            <>
                <List.Item
                    icon={<UserIcon />}
                    title="User Profile"
                    description="View and edit your profile information"
                />
                <List.Item
                    icon={<SettingsIcon />}
                    title="Settings"
                    description="Configure application settings"
                />
                <List.Item
                    icon={<HelpIcon />}
                    title="Help & Support"
                    description="Get assistance and view documentation"
                />
            </>
        )
    },
    decorators: [
        Story => (
            <div className="bg-neutral-light p-md">
                <Story />
            </div>
        )
    ]
};

export const WithBaseBackground: Story = {
    args: {
        ...Default.args,
        background: "base"
    }
};

export const WithLightBackground: Story = {
    args: {
        background: "light",
        children: (
            <>
                <List.Item
                    icon={<UserIcon />}
                    title="User Profile"
                    description="View and edit your profile information"
                />
                <List.Item
                    icon={<SettingsIcon />}
                    title="Settings"
                    description="Configure application settings"
                />
                <List.Item
                    icon={<HelpIcon />}
                    title="Help & Support"
                    description="Get assistance and view documentation"
                />
            </>
        )
    }
};

export const WithUnderlineVariant: Story = {
    args: {
        ...Default.args,
        variant: "underline"
    }
};

export const WithContainerVariant: Story = {
    args: {
        variant: "container",
        children: (
            <>
                <List.Item
                    icon={<UserIcon />}
                    title="User Profile"
                    description="View and edit your profile information"
                />
                <List.Item
                    icon={<SettingsIcon />}
                    title="Settings"
                    description="Configure application settings"
                />
                <List.Item
                    icon={<HelpIcon />}
                    title="Help & Support"
                    description="Get assistance and view documentation"
                />
            </>
        )
    },
    decorators: [
        Story => (
            <div className="bg-neutral-light p-md">
                <Story />
            </div>
        )
    ]
};

export const WithDescription: Story = {
    args: {
        children: (
            <>
                <List.Item
                    title="User Profile"
                    description="View and edit your profile information"
                />
                <List.Item title="Settings" description="Configure application settings" />
                <List.Item
                    title="Help & Support"
                    description="Get assistance and view documentation"
                />
            </>
        )
    }
};

export const WithIcon: Story = {
    args: {
        children: (
            <>
                <List.Item icon={<UserIcon />} title="User Profile" />
                <List.Item icon={<SettingsIcon />} title="Settings" />
                <List.Item icon={<HelpIcon />} title="Help & Support" />
            </>
        )
    }
};

export const WithIconsAndDescriptions: Story = {
    args: {
        children: (
            <>
                <List.Item
                    icon={<UserIcon />}
                    title="User Profile"
                    description="View and edit your profile information"
                />
                <List.Item
                    icon={<SettingsIcon />}
                    title="Settings"
                    description="Configure application settings"
                />
                <List.Item
                    icon={<HelpIcon />}
                    title="Help & Support"
                    description="Get assistance and view documentation"
                />
            </>
        )
    }
};

export const WithAvatar: Story = {
    args: {
        ...Default.args,
        children: (
            <>
                <ListItem
                    index={1}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={
                        <Avatar
                            image={
                                <Avatar.Image src="https://i.pravatar.cc/300?img=1" alt="@webiny" />
                            }
                            fallback={<Avatar.Fallback>W</Avatar.Fallback>}
                        />
                    }
                />
                <ListItem
                    index={2}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={
                        <Avatar
                            image={
                                <Avatar.Image src="https://i.pravatar.cc/300?img=2" alt="@webiny" />
                            }
                            fallback={<Avatar.Fallback>W</Avatar.Fallback>}
                        />
                    }
                />
            </>
        )
    }
};

export const WithHandle: Story = {
    args: {
        ...Default.args,
        children: (
            <>
                <ListItem
                    index={1}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    handle={<List.Item.Handle />}
                />
                <ListItem
                    index={2}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    handle={<List.Item.Handle />}
                />
            </>
        )
    }
};

export const WithActions: Story = {
    ...Default,
    args: {
        children: (
            <>
                <ListItem
                    index={1}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<List.Item.Icon icon={<ChartIcon />} label={"Chart"} />}
                    actions={
                        <>
                            <List.Item.Action icon={<EditIcon />} />
                            <List.Item.Action icon={<TrashIcon />} />
                            <List.Item.Action.Separator />
                            <List.Item.Action icon={<OpenIcon />} />
                            <List.Item.Action icon={<MoreIcon />} />
                        </>
                    }
                />
                <ListItem
                    index={2}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<List.Item.Icon icon={<ChartIcon />} label={"Chart"} />}
                    actions={
                        <>
                            <List.Item.Action icon={<EditIcon />} />
                            <List.Item.Action icon={<TrashIcon />} />
                            <List.Item.Action.Separator />
                            <List.Item.Action icon={<OpenIcon />} />
                            <List.Item.Action icon={<MoreIcon />} />
                        </>
                    }
                />
            </>
        )
    }
};

export const WithDisabled: Story = {
    args: {
        children: (
            <>
                <List.Item
                    title="User Profile"
                    description="View and edit your profile information"
                    onClick={() => alert("User Profile clicked")}
                />
                <List.Item
                    title="Settings"
                    description="Configure application settings"
                    disabled={true}
                    onClick={() => alert("This alert won't show because the item is disabled")}
                />
                <List.Item
                    title="Help & Support"
                    description="Get assistance and view documentation"
                    onClick={() => alert("Help & Support clicked")}
                />
            </>
        )
    }
};

export const WithActivated: Story = {
    args: {
        children: (
            <>
                <List.Item
                    title="User Profile"
                    description="View and edit your profile information"
                    activated={true}
                    onClick={() => console.log("User Profile clicked")}
                />
                <List.Item
                    title="Settings"
                    description="Configure application settings"
                    onClick={() => console.log("Settings clicked")}
                />
                <List.Item
                    title="Help & Support"
                    description="Get assistance and view documentation"
                    onClick={() => console.log("Help & Support clicked")}
                />
            </>
        )
    }
};

export const WithClickHandlers: Story = {
    args: {
        children: (
            <>
                <List.Item
                    title="User Profile"
                    description="View and edit your profile information"
                    onClick={() => alert("User Profile clicked")}
                />
                <List.Item
                    title="Settings"
                    description="Configure application settings"
                    onClick={() => alert("Settings clicked")}
                />
                <List.Item
                    title="Help & Support"
                    description="Get assistance and view documentation"
                    onClick={() => alert("Help & Support clicked")}
                />
            </>
        )
    }
};

export const WithSelectedItem: Story = {
    render: () => {
        // Using render function to handle state
        const [selectedIndex, setSelectedIndex] = React.useState(0);

        return (
            <List>
                <List.Item
                    title="User Profile"
                    description="View and edit your profile information"
                    selected={selectedIndex === 0}
                    onClick={() => setSelectedIndex(0)}
                />
                <List.Item
                    title="Settings"
                    description="Configure application settings"
                    selected={selectedIndex === 1}
                    onClick={() => setSelectedIndex(1)}
                />
                <List.Item
                    title="Help & Support"
                    description="Get assistance and view documentation"
                    selected={selectedIndex === 2}
                    onClick={() => setSelectedIndex(2)}
                />
            </List>
        );
    }
};

export const Documentation: Story = {
    args: {
        variant: "underline",
        background: "base",
        children: (
            <>
                <List.Item
                    icon={<UserIcon />}
                    title="User Profile"
                    description="View and edit your profile information"
                    onClick={() => console.log("User Profile clicked")}
                />
                <List.Item
                    icon={<SettingsIcon />}
                    title="Settings"
                    description="Configure application settings"
                    onClick={() => console.log("Settings clicked")}
                />
                <List.Item
                    icon={<HelpIcon />}
                    title="Help & Support"
                    description="Get assistance and view documentation"
                    onClick={() => console.log("Help & Support clicked")}
                />
            </>
        )
    },
    argTypes: {
        variant: {
            control: "select",
            options: ["underline", "container"],
            description: "The visual style of the list"
        },
        background: {
            control: "select",
            options: ["base", "light", "transparent"],
            description: "The background color of the list"
        },
        children: {
            description: "The content of the list. Please refer to the example code for details."
        }
    },
    parameters: {
        docs: {
            description: {
                story: "This example shows a List with icons, titles, descriptions, and click handlers."
            }
        }
    }
};
