import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Popover } from "./Popover.js";

const meta: Meta<typeof Popover> = {
    title: "Components/Popover",
    component: Popover,
    parameters: {
        layout: "padded"
    },
    argTypes: {
        align: {
            control: "select",
            options: ["start", "center", "end"]
        },
        side: {
            control: "select",
            options: ["top", "bottom", "left", "right"]
        }
    },
    decorators: [
        Story => (
            <div className="bg-[#f4f4f4] flex items-center justify-center w-full h-[300px]">
                <Story />
            </div>
        )
    ]
};

export default meta;

type Story = StoryObj<typeof Popover>;

export const Default: Story = {
    args: {
        trigger: <p>Popover trigger</p>,
        content: (
            <div className={"w-[260px]"}>
                <strong>Lorem ipsum dolor sit amet</strong>, consectetur adipiscing elit. Morbi
                lectus leo, dapibus vitae mollis dictum, vulputate eget lorem. Aliquam rutrum auctor
                tempus.
            </div>
        )
    }
};

export const AccentVariant: Story = {
    args: {
        ...Default.args,
        variant: "accent"
    }
};

export const WithArrowAccentVariant: Story = {
    args: {
        ...AccentVariant.args,
        arrow: true
    }
};

export const SubtleVariant: Story = {
    args: {
        ...Default.args,
        variant: "subtle"
    },
    decorators: [
        Story => (
            <div className="flex items-center justify-center bg-neutral-dark text-neutral-light w-full h-[300px]">
                <Story />
            </div>
        )
    ]
};

export const WithArrowSubtleVariant: Story = {
    args: {
        variant: "subtle",
        trigger: <p>Popover trigger</p>,
        arrow: true,
        content: (
            <div className={"w-[260px]"}>
                <strong>Lorem ipsum dolor sit amet</strong>, consectetur adipiscing elit. Morbi
                lectus leo, dapibus vitae mollis dictum, vulputate eget lorem. Aliquam rutrum auctor
                tempus.
            </div>
        )
    },
    decorators: SubtleVariant.decorators
};

export const Documentation: Story = {
    args: {
        align: "center",
        side: "bottom",
        variant: "subtle",
        arrow: false,
        close: false,
        trigger: <p>Popover trigger</p>,
        content: (
            <div className={"w-[260px]"}>
                <strong>Lorem ipsum dolor sit amet</strong>, consectetur adipiscing elit. Morbi
                lectus leo, dapibus vitae mollis dictum, vulputate eget lorem. Aliquam rutrum auctor
                tempus.
            </div>
        )
    },
    argTypes: {
        trigger: {
            description:
                "The element that triggers the popover when clicked. Please refer to the example code for details."
        },
        content: {
            description:
                "The content to display inside the popover. Please refer to the example code for details."
        },
        side: {
            description: "The side of the trigger where the popover appears.",
            control: "select",
            options: ["top", "right", "bottom", "left"]
        },
        align: {
            description: "The alignment of the popover relative to the trigger.",
            control: "select",
            options: ["start", "center", "end"]
        },
        variant: {
            description: "The visual style variant of the popover.",
            control: "select",
            options: ["accent", "subtle"]
        },
        arrow: {
            description: "Whether to show an arrow pointing to the trigger.",
            control: "boolean"
        },
        close: {
            description: "Whether to show a close button inside the popover.",
            control: "boolean"
        }
    }
};
