import type { Meta, StoryObj } from "@storybook/react";

import { Heading } from "./Heading";

const meta: Meta<typeof Heading> = {
    title: "Components/Heading",
    component: Heading,
    tags: ["autodocs"],
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
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const Heading2: Story = {
    args: {
        level: 2,
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const Heading3: Story = {
    args: {
        level: 3,
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const Heading4: Story = {
    args: {
        level: 4,
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const Heading5: Story = {
    args: {
        level: 5,
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const Heading6: Story = {
    args: {
        level: 6,
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};
