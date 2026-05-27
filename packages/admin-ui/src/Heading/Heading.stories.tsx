import type { Meta, StoryObj } from "@storybook/react";

import { Heading } from "./Heading.js";

const meta: Meta<typeof Heading> = {
    title: "Components/Heading",
    component: Heading,
    argTypes: {
        level: {
            control: {
                type: "number",
                min: 1,
                max: 6
            }
        }
    }
};

export default meta;
type Story = StoryObj<typeof Heading>;

export const Heading1: Story = {
    args: {
        level: 1,
        children:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const Heading2: Story = {
    args: {
        level: 2,
        children:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const Heading3: Story = {
    args: {
        level: 3,
        children:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const Heading4: Story = {
    args: {
        level: 4,
        children:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const Heading5: Story = {
    args: {
        level: 5,
        children:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const Heading6: Story = {
    args: {
        level: 6,
        children:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const As: Story = {
    args: {
        level: 2,
        as: "h1",
        children: "This is visually a Heading level 2, but semantically an h1"
    }
};

export const Documentation: Story = {
    args: {
        level: 1,
        children: "This is a heading",
        as: undefined,
        className: undefined
    },
    argTypes: {
        level: {
            description: "The heading level (1-6) which determines the size and semantic meaning.",
            control: "select",
            options: [1, 2, 3, 4, 5, 6]
        },
        as: {
            description:
                "The HTML tag to render, overriding the default tag based on level. This is useful when you want to maintain semantic structure but want different visual styling.",
            control: "select",
            options: ["none", "h1", "h2", "h3", "h4", "h5", "h6"]
        },
        children: {
            description: "The content of the heading.",
            control: "text"
        },
        className: {
            description:
                "Additional CSS classes to apply to the heading. You can pass multiple classes, separated by commas or spaces."
        }
    }
};
