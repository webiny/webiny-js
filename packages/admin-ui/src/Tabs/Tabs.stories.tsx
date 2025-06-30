import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ReactComponent as PersonIcon } from "@webiny/icons/person.svg";
import { ReactComponent as LockIcon } from "@webiny/icons/lock.svg";
import { Tabs } from "./Tabs";

const meta: Meta<typeof Tabs> = {
    title: "Components/Tabs",
    component: Tabs,
    parameters: {
        layout: "padded"
    }
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
    args: {
        tabs: [
            <Tabs.Tab
                key={"account"}
                value={"account"}
                trigger={"Account"}
                content={
                    "Account content - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vel libero nec libero lacinia fermentum. Nullam nec nunc nec libero lacinia fermentum. Nullam nec nunc nec libero lacinia fermentum. Nullam nec nunc nec libero lacinia fermentum."
                }
            />,
            <Tabs.Tab
                key={"password"}
                value={"password"}
                trigger={"Password"}
                content={
                    "Password content - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vel libero nec libero lacinia fermentum. Nullam nec nunc nec libero lacinia fermentum. "
                }
            />
        ]
    }
};

export const SizeSmall: Story = {
    args: {
        ...Default.args,
        size: "sm"
    }
};

export const SizeMedium: Story = {
    args: {
        ...Default.args,
        size: "md"
    }
};

export const SizeLarge: Story = {
    args: {
        ...Default.args,
        size: "lg"
    }
};

export const SizeExtraLarge: Story = {
    args: {
        ...Default.args,
        size: "xl"
    }
};

export const SpacingExtraSmall: Story = {
    args: {
        ...Default.args,
        spacing: "xs"
    }
};

export const SpacingSmall: Story = {
    args: {
        ...Default.args,
        spacing: "sm"
    }
};

export const SpacingMedium: Story = {
    args: {
        ...Default.args,
        spacing: "md"
    }
};

export const SpacingLarge: Story = {
    args: {
        ...Default.args,
        spacing: "lg"
    }
};

export const SpacingExtraLarge: Story = {
    args: {
        ...Default.args,
        spacing: "xl"
    }
};

export const SpacingDoubleExtraLarge: Story = {
    args: {
        ...Default.args,
        spacing: "xxl"
    }
};

export const WithSeparator: Story = {
    args: {
        ...Default.args,
        separator: true
    }
};

export const WithDefaultValue: Story = {
    args: {
        ...Default.args,
        defaultValue: "password"
    }
};

export const WithControlledValue: Story = {
    args: {
        ...Default.args,
        value: "password"
    },
    render: args => {
        const [value, setValue] = useState(args.value);
        return <Tabs {...args} value={value} onValueChange={setValue} />;
    }
};

export const WithIcons: Story = {
    args: {
        ...Default.args,
        tabs: [
            <Tabs.Tab
                key={"account"}
                value={"account"}
                trigger={"Account"}
                content={
                    "Account content - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vel libero nec libero lacinia fermentum. Nullam nec nunc nec libero lacinia fermentum. Nullam nec nunc nec libero lacinia fermentum. Nullam nec nunc nec libero lacinia fermentum."
                }
                icon={<PersonIcon />}
            />,
            <Tabs.Tab
                key={"password"}
                value={"password"}
                trigger={"Password"}
                content={
                    "Password content - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vel libero nec libero lacinia fermentum. Nullam nec nunc nec libero lacinia fermentum. "
                }
                icon={<LockIcon />}
            />
        ]
    }
};

export const WithDisabledTab: Story = {
    args: {
        ...Default.args,
        tabs: [
            <Tabs.Tab
                key={"account"}
                value={"account"}
                trigger={"Account"}
                content={
                    "Account content - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vel libero nec libero lacinia fermentum. Nullam nec nunc nec libero lacinia fermentum. Nullam nec nunc nec libero lacinia fermentum. Nullam nec nunc nec libero lacinia fermentum."
                }
                disabled={true}
            />,
            <Tabs.Tab
                key={"password"}
                value={"password"}
                trigger={"Password"}
                content={
                    "Password content - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vel libero nec libero lacinia fermentum. Nullam nec nunc nec libero lacinia fermentum. "
                }
            />
        ]
    }
};

export const WithHiddenTab: Story = {
    args: {
        ...Default.args,
        tabs: [
            <Tabs.Tab
                key={"account"}
                value={"account"}
                trigger={"Account"}
                content={
                    "Account content - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vel libero nec libero lacinia fermentum. Nullam nec nunc nec libero lacinia fermentum. Nullam nec nunc nec libero lacinia fermentum. Nullam nec nunc nec libero lacinia fermentum."
                }
                visible={false}
            />,
            <Tabs.Tab
                key={"password"}
                value={"password"}
                trigger={"Password"}
                content={
                    "Password content - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vel libero nec libero lacinia fermentum. Nullam nec nunc nec libero lacinia fermentum. "
                }
            />
        ]
    }
};

export const WithCustomTabSpacing: Story = {
    args: {
        ...Default.args,
        spacing: "sm",
        tabs: [
            <Tabs.Tab
                key={"account"}
                value={"account"}
                trigger={"Account"}
                content={
                    "Tab with custom spacing XXL - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vel libero nec libero lacinia fermentum. Nullam nec nunc nec libero lacinia fermentum."
                }
                spacing={"xxl"}
            />,
            <Tabs.Tab
                key={"password"}
                value={"password"}
                trigger={"Password"}
                content={
                    "Tab with inherited spacing - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vel libero nec libero lacinia fermentum. Nullam nec nunc nec libero lacinia fermentum. "
                }
            />
        ]
    }
};

// Update the Documentation story to properly handle control changes
export const Documentation: Story = {
    render: args => {
        // Force re-render when args change by using a key
        return <Tabs key={JSON.stringify(args)} {...args} />;
    },
    args: {
        size: "md",
        spacing: "lg",
        separator: true,
        defaultValue: "account",
        tabs: [
            <Tabs.Tab
                key={"account"}
                value={"account"}
                trigger={"Account"}
                content={
                    "Account content - This tab contains account settings and personal information. Users can update their profile details, change email address, and manage notification preferences."
                }
            />,
            <Tabs.Tab
                key={"security"}
                value={"security"}
                trigger={"Security"}
                content={
                    "Security content - This tab contains security settings. Users can change their password, enable two-factor authentication, and review recent account activity."
                }
            />,
            <Tabs.Tab
                key={"preferences"}
                value={"preferences"}
                trigger={"Preferences"}
                content={
                    "Preferences content - This tab contains user preferences. Users can customize the interface, set language preferences, and configure other application settings."
                }
            />
        ],
        value: undefined
    },
    argTypes: {
        size: {
            description: "Size of the tabs",
            control: "select",
            options: ["sm", "md", "lg", "xl"],
            defaultValue: "md"
        },
        spacing: {
            description: "Spacing around the tabs and content",
            control: "select",
            options: ["xs", "sm", "md", "lg", "xl", "xxl"],
            defaultValue: "lg"
        },
        separator: {
            description:
                "Whether to show a separator line below the tabs, by default it's `false`.",
            control: "boolean",
            defaultValue: false
        },
        defaultValue: {
            description: "The value of the tab that should be active by default",
            control: "text"
        },
        value: {
            description:
                "The controlled value of the active tab, please refer to the example code for details.",
            control: "none"
        },
        tabs: {
            description: "The tabs to render, please refer to the example code for details.",
            control: "none"
        }
    }
};
