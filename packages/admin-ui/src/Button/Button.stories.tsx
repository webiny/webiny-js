import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ReactComponent as PencilIcon } from "@webiny/icons/edit.svg";
import { Button } from "./Button.js";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Button> = {
    title: "Components/Button",
    component: Button,
    argTypes: {
        variant: {
            description: "Type",
            control: "select",
            options: ["primary", "secondary", "tertiary", "ghost", "ghost-negative"],
            defaultValue: "primary"
        },
        size: {
            description: "Size",
            control: "select",
            options: ["sm", "md", "lg", "xl"],
            defaultValue: "md"
        },
        text: {
            description: "Label",
            control: "text",
            defaultValue: "Button"
        },
        disabled: {
            control: "boolean",
            defaultValue: false
        },
        icon: {
            description: "Please refer to the 'With Icon' button example below for details."
        },
        iconPosition: {
            description: "Please refer to the 'With Icon' button example below for details.",
            control: "select",
            defaultValue: "start",
            options: ["start", "end"]
        },
        asChild: {
            description: "Please refer to the 'As Child' button example below for details."
        },
        // Note: after upgrading to Storybook 8.X, use `fn`from `@storybook/test` to spy on the onClick argument.
        onClick: { action: "onClick" }
    }
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
    args: {
        variant: "primary",
        text: "Button"
    }
};

export const Secondary: Story = {
    args: {
        ...Primary.args,
        variant: "secondary"
    }
};

export const Tertiary: Story = {
    args: {
        ...Primary.args,
        variant: "tertiary"
    }
};

export const Ghost: Story = {
    args: {
        ...Primary.args,
        variant: "ghost"
    }
};

export const GhostNegative: Story = {
    decorators: [
        (Story: any) => (
            <div className="bg-[#25292e] p-[50px] rounded-[5px]">
                <Story />
            </div>
        )
    ],
    args: {
        ...Primary.args,
        variant: "ghost-negative"
    }
};

export const Small: Story = {
    args: {
        ...Primary.args,
        size: "sm"
    }
};

export const Medium: Story = {
    args: {
        ...Primary.args,
        size: "md"
    }
};

export const Large: Story = {
    args: {
        ...Primary.args,
        size: "lg"
    }
};

export const ExtraLarge: Story = {
    args: {
        ...Primary.args,
        size: "xl"
    }
};

export const WithIcon: Story = {
    args: {
        ...Primary.args,
        icon: <PencilIcon />
    }
};

export const WithIconPositionEnd: Story = {
    args: {
        ...Primary.args,
        icon: <PencilIcon />,
        iconPosition: "end"
    }
};

export const WithAsChild: Story = {
    args: {
        ...Primary.args,
        asChild: true,
        text: <span>Button</span>
    }
};

/* The Documentation story is created for the Docs page.
 * The description column for the `iconPosition` and `icon` props displays
 * an extra dash (-), and the formatting breaks unless defined in the story.
 * Hence, this Documentation story was created.
 */

export const Documentation: Story = {
    args: {
        variant: "primary",
        text: "Button",
        size: "md",
        disabled: false,
        icon: "",
        iconPosition: "start",
        asChild: false
    }
};
