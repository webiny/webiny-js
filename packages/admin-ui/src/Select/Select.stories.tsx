import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ReactComponent as SearchIcon } from "@material-design-icons/svg/outlined/search.svg";

import { Select } from "./Select";
import { Icon } from "~/Icon";

const meta: Meta<typeof Select> = {
    title: "Components/Select",
    component: Select,
    tags: ["autodocs"],
    argTypes: {
        // Note: after upgrading to Storybook 8.X, use `fn`from `@storybook/test` to spy on the onOpenChange and onValueChange argument.
        onOpenChange: { action: "onOpenChange" },
        onValueChange: { action: "onValueChange" }
    }
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
    args: {
        placeholder: "Default Select",
        options: ["Value 1", "Value 2", "Value 3"]
    }
};

export const WithValue: Story = {
    args: {
        ...Default.args,
        value: "Value 2"
    }
};

export const WithFormattedOptions: Story = {
    args: {
        ...Default.args,
        options: [
            {
                label: "Value 1",
                value: "value-1"
            },
            {
                label: "Value 2",
                value: "value-2"
            },
            {
                label: "Value 3",
                value: "value-3"
            }
        ]
    }
};

export const WithDisabledOptions: Story = {
    args: {
        ...Default.args,
        options: [
            {
                label: "Value 1",
                value: "value-1"
            },
            {
                label: "Value 2",
                value: "value-2",
                disabled: true
            },
            {
                label: "Value 3",
                value: "value-3"
            }
        ]
    }
};

export const WithGroups: Story = {
    args: {
        ...Default.args,
        options: [
            {
                label: "Group 1",
                options: [
                    {
                        label: "Value 1",
                        value: "group-1-value-1"
                    },
                    {
                        label: "Value 2",
                        value: "group-1-value-2"
                    },
                    {
                        label: "Value 3",
                        value: "group-1-value-3"
                    }
                ]
            },
            {
                label: "Group 2",
                options: [
                    {
                        label: "Value 1",
                        value: "group-2-value-1"
                    },
                    {
                        label: "Value 2",
                        value: "group-2-value-2"
                    },
                    {
                        label: "Value 3",
                        value: "group-2-value-3"
                    }
                ]
            }
        ]
    }
};

export const WithIcon: Story = {
    args: {
        ...Default.args,
        icon: <Icon icon={<SearchIcon />} label={"Search"} />
    }
};

export const Medium: Story = {
    args: {
        ...Default.args,
        size: "md"
    }
};

export const Large: Story = {
    args: {
        ...Default.args,
        size: "lg"
    }
};

export const Outline: Story = {
    args: {
        ...Default.args,
        variant: "outline"
    }
};

export const Ghost: Story = {
    args: {
        ...Default.args,
        variant: "ghost"
    }
};

export const Disabled: Story = {
    args: {
        ...Default.args,
        disabled: true
    }
};
