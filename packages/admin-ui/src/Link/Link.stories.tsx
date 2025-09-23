import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { createBrowserHistory } from "history";
import { BrowserRouter } from "@webiny/react-router";
import { Link } from "./Link.js";
import { Text } from "~/Text/index.js";

const history = createBrowserHistory();

const meta: Meta<typeof Link> = {
    title: "Components/Link",
    component: Link,
    decorators: [
        (Story: React.ComponentType) => {
            return (
                <BrowserRouter>
                    <Story />
                </BrowserRouter>
            );
        }
    ],
    argTypes: {
        size: { control: "select", options: ["sm", "md", "lg", "xl"] },
        variant: { control: "select", options: ["primary", "secondary"] }
    }
};

export default meta;

type Story = StoryObj<typeof Link>;

export const Default: Story = {
    args: {
        to: "#",
        children:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const LinkXl: Story = {
    args: {
        size: "xl",
        to: "#",
        children:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const LinkLg: Story = {
    args: {
        size: "lg",
        to: "#",
        children:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const LinkMd: Story = {
    args: {
        size: "md",
        to: "#",
        children:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const LinkSm: Story = {
    args: {
        size: "sm",
        to: "#",
        children:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const InheritedSize: Story = {
    name: "Link with inherited size",
    render: linkProps => {
        return (
            <Text>
                <Text size="lg">
                    Size of this text is set to large, so,&nbsp;
                    <Link {...linkProps}>this link&apos;s</Link> size is also automatically set to
                    large.
                </Text>
            </Text>
        );
    },
    args: {
        to: "#",
        children:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const WithUnderline: Story = {
    args: {
        underline: true,
        to: "#",
        children:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const PrimaryNegative: Story = {
    decorators: [
        Story => (
            <div className="wby-bg-[#25292e] wby-p-[300px] wby-rounded-[5px] wby-text-neutral-dimmed">
                <Story />
            </div>
        )
    ],
    render: args => {
        return (
            <Text>
                Lorem <Link {...args}>ipsum dolor sit amet</Link>, consectetur adipiscing elit.
                Fusce tempus tortor eu sapien interdum rhoncus.
            </Text>
        );
    },
    args: {
        ...Default.args,
        variant: "primary-negative"
    }
};

export const SecondaryNegative: Story = {
    decorators: [
        Story => (
            <div className="wby-bg-[#25292e] wby-p-[300px] wby-rounded-[5px] wby-text-neutral-dimmed">
                <Story />
            </div>
        )
    ],
    render: args => {
        return (
            <Text>
                Lorem <Link {...args}>ipsum dolor sit amet</Link>, consectetur adipiscing elit.
                Fusce tempus tortor eu sapien interdum rhoncus.
            </Text>
        );
    },
    args: {
        ...Default.args,
        variant: "secondary-negative"
    }
};

export const Documentation: Story = {
    args: {
        to: "#",
        variant: "primary",
        size: "md",
        underline: false,
        disabled: false,
        children: "This is a link"
    },
    argTypes: {
        to: {
            description:
                "The URL or path the link points to. If it’s a relative path, you can pass it as-is—it will automatically resolve based on the parent route. For a full URL, be sure to pass the complete address starting with `https://...`",
            control: "text",
            defaultValue: "#"
        },
        variant: {
            description: "Visual style of the link",
            control: "select",
            options: ["primary", "secondary", "primary-negative", "secondary-negative"],
            defaultValue: "primary"
        },
        size: {
            description: "Size of the link text",
            control: "select",
            options: ["inherit", "sm", "md", "lg", "xl"],
            defaultValue: "inherit"
        },
        underline: {
            description: "Whether the link should be underlined by default",
            control: "boolean",
            defaultValue: false
        },
        disabled: {
            description: "Whether the link is disabled",
            control: "boolean",
            defaultValue: false
        },
        children: {
            description: "The content of the link. It can be any valid React node.",
            control: "text",
            defaultValue: "This is a link"
        }
    }
};
