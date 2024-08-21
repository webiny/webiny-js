import type { Meta, StoryObj } from "@storybook/react";

import { Text } from "./Text";

const meta: Meta<typeof Text> = {
    title: "Components/Text",
    component: Text,
    tags: ["autodocs"],
    argTypes: {
        size: { control: "select", options: ["sm", "md", "lg", "xl"] }
    }
};

export default meta;
type Story = StoryObj<typeof Text>;

export const TextXl: Story = {
    args: {
        size: "xl",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const TextLg: Story = {
    args: {
        size: "lg",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const TextMd: Story = {
    args: {
        size: "md",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};

export const TextSm: Story = {
    args: {
        size: "sm",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus tortor eu sapien interdum rhoncus."
    }
};
