import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip } from "~/Tooltip/index.js";
import { Button } from "~/Button/index.js";
import { Text } from "~/Text/index.js";
import { Icon } from "~/Icon/index.js";

import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";
import { ReactComponent as HelpIcon } from "@webiny/icons/help.svg";

const meta: Meta<typeof Tooltip> = {
    title: "Components/Tooltip",
    component: Tooltip,
    parameters: {
        layout: "padded"
    },
    argTypes: {
        variant: {
            control: "select",
            options: ["accent", "subtle"]
        },
        align: {
            control: "select",
            options: ["start", "center", "end"]
        },
        side: {
            control: "select",
            options: ["top", "right", "bottom", "left"]
        },
        showArrow: {
            control: "boolean",
            defaultValue: true
        }
    },
    decorators: [
        Story => (
            <Tooltip.Provider>
                <div className="flex justify-center items-center h-48">
                    <Story />
                </div>
            </Tooltip.Provider>
        )
    ]
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
    args: {
        trigger: <p>Tooltip trigger</p>,
        content: (
            <>
                <strong>Lorem ipsum dolor sit amet</strong>, consectetur adipiscing elit. Donec
                viverra sit amet massa sagittis sollicitudin.
            </>
        )
    }
};

export const AccentVariant: Story = {
    args: {
        ...Default.args,
        variant: "accent"
    }
};

export const SubtleVariant: Story = {
    args: {
        ...Default.args,
        variant: "subtle"
    },
    decorators: [
        Story => (
            <Tooltip.Provider>
                <div className="flex justify-center items-center bg-neutral-dark text-neutral-light w-full h-48">
                    <Story />
                </div>
            </Tooltip.Provider>
        )
    ]
};

export const WithoutArrow: Story = {
    args: {
        ...Default.args,
        showArrow: false
    }
};

export const WithIconTrigger: Story = {
    args: {
        trigger: <Icon icon={<InfoIcon />} label="Information" />,
        content: "This is a helpful tooltip"
    }
};

export const Documentation: Story = {
    args: {
        align: "center",
        side: "top",
        variant: "accent",
        showArrow: true,
        trigger: <p>Tooltip trigger</p>,
        content: (
            <>
                <strong>Lorem ipsum dolor sit amet</strong>, consectetur adipiscing elit. Donec
                viverra sit amet massa sagittis sollicitudin.
            </>
        )
    },
    argTypes: {
        trigger: {
            description:
                "The element that triggers the tooltip when hovered. Please refer to the example code for details."
        },
        content: {
            description:
                "The content to display inside the tooltip. Please refer to the example code for details."
        },
        side: {
            description: "The side of the trigger where the tooltip appears.",
            control: "select",
            options: ["top", "right", "bottom", "left"]
        },
        align: {
            description: "The alignment of the tooltip relative to the trigger.",
            control: "select",
            options: ["start", "center", "end"]
        },
        variant: {
            description: "The visual style variant of the tooltip.",
            control: "select",
            options: ["accent", "subtle"]
        },
        showArrow: {
            description: "Whether to show an arrow pointing to the trigger.",
            control: "boolean"
        }
    }
};

export const Positioning: Story = {
    render: () => (
        <div className="flex gap-md">
            <Tooltip trigger={<p>Top</p>} content={<div>Tooltip on top</div>} side="top" />
            <Tooltip trigger={<p>Right</p>} content={<div>Tooltip on right</div>} side="right" />
            <Tooltip trigger={<p>Bottom</p>} content={<div>Tooltip on bottom</div>} side="bottom" />
            <Tooltip trigger={<p>Left</p>} content={<div>Tooltip on left</div>} side="left" />
        </div>
    )
};

export const Alignment: Story = {
    render: () => (
        <div className="flex gap-md">
            <Tooltip trigger={<p>Start</p>} content={<div>Aligned to start</div>} align="start" />
            <Tooltip
                trigger={<p>Center</p>}
                content={<div>Aligned to center</div>}
                align="center"
            />
            <Tooltip trigger={<p>End</p>} content={<div>Aligned to end</div>} align="end" />
        </div>
    )
};

export const WithButtonTrigger: Story = {
    args: {
        trigger: <Button text="Hover me" />,
        content: "This tooltip is triggered by a button"
    }
};

export const WithFormattedContent: Story = {
    args: {
        trigger: <p>Hover for more info</p>,
        content: (
            <div className="flex flex-col gap-xs">
                <Text size="sm" className="font-bold">
                    Important Information
                </Text>
                <Text size="sm">
                    This tooltip contains formatted content with multiple paragraphs.
                </Text>
                <Text size="sm">You can include various elements inside tooltips.</Text>
            </div>
        )
    }
};

export const WithHelpIcon: Story = {
    args: {
        trigger: <Icon icon={<HelpIcon />} label="Help" />,
        content: "Need help? Contact support at support@example.com"
    }
};
