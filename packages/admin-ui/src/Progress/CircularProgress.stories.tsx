import type { Meta, StoryObj } from "@storybook/react";

import { CircularProgress } from "./CircularProgress";

const meta: Meta<typeof CircularProgress> = {
    title: "Components/CircularProgress",
    component: CircularProgress,
    tags: ["autodocs"],
    argTypes: {}
};

export default meta;

type Story = StoryObj<typeof CircularProgress>;

export const CircularProgressWithoutText: Story = {
    name: "Without text",
    args: {}
};

export const CircularProgressWithText: Story = {
    name: "With text",
    args: {
        text: "Loading..."
    }
};
