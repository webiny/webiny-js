import React from "react";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { Tag } from "./Tag.js";

const meta: Meta<typeof Tag> = {
    title: "Components/Tag",
    component: Tag,
    parameters: {
        layout: "padded"
    }
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {
    args: {
        content: "Label"
    }
};

export const WithOnClickCallback: Story = {
    args: {
        ...Default.args,
        onClick: evt => {
            console.log("onClick", evt);
        }
    }
};

export const WithOnDismissCallback: Story = {
    args: {
        ...Default.args,
        onDismiss: evt => {
            console.log("onDismiss", evt);
        }
    }
};

export const WithCustomDismissIconElement: Story = {
    args: {
        ...WithOnDismissCallback.args,
        dismissIconElement: <AddIcon />,
        dismissIconLabel: "Custom dismiss label"
    }
};

export const NeutralBase: Story = {
    args: {
        ...WithOnDismissCallback.args,
        variant: "neutral-base"
    }
};

export const NeutralBaseDisabled: Story = {
    args: {
        ...NeutralBase.args,
        disabled: true
    }
};

export const NeutralBaseOutline: Story = {
    args: {
        ...WithOnDismissCallback.args,
        variant: "neutral-base-outline"
    }
};

export const NeutralBaseOutlineDisabled: Story = {
    args: {
        ...NeutralBaseOutline.args,
        disabled: true
    }
};

export const NeutralLight: Story = {
    args: {
        ...WithOnDismissCallback.args,
        variant: "neutral-light"
    }
};

export const NeutralLightDisabled: Story = {
    args: {
        ...NeutralLight.args,
        disabled: true
    }
};

export const NeutralMuted: Story = {
    args: {
        ...WithOnDismissCallback.args,
        variant: "neutral-muted"
    }
};

export const NeutralMutedDisabled: Story = {
    args: {
        ...NeutralMuted.args,
        disabled: true
    }
};

export const NeutralStrong: Story = {
    args: {
        ...WithOnDismissCallback.args,
        variant: "neutral-strong"
    }
};

export const NeutralStrongDisabled: Story = {
    args: {
        ...NeutralStrong.args,
        disabled: true
    }
};

export const NeutralXStrong: Story = {
    args: {
        ...WithOnDismissCallback.args,
        variant: "neutral-xstrong"
    }
};

export const NeutralXStrongDisabled: Story = {
    args: {
        ...NeutralXStrong.args,
        disabled: true
    }
};

export const NeutralDark: Story = {
    args: {
        ...WithOnDismissCallback.args,
        variant: "neutral-dark"
    }
};

export const NeutralDarkDisabled: Story = {
    args: {
        ...NeutralDark.args,
        disabled: true
    }
};

export const Accent: Story = {
    args: {
        ...WithOnDismissCallback.args,
        variant: "accent"
    }
};

export const AccentDisabled: Story = {
    args: {
        ...Accent.args,
        disabled: true
    }
};

export const AccentLight: Story = {
    args: {
        ...WithOnDismissCallback.args,
        variant: "accent-light"
    }
};

export const AccentLightDisabled: Story = {
    args: {
        ...AccentLight.args,
        disabled: true
    }
};

export const Success: Story = {
    args: {
        ...WithOnDismissCallback.args,
        variant: "success"
    }
};

export const SuccessDisabled: Story = {
    args: {
        ...Success.args,
        disabled: true
    }
};

export const SuccessLight: Story = {
    args: {
        ...WithOnDismissCallback.args,
        variant: "success-light"
    }
};

export const SuccessLightDisabled: Story = {
    args: {
        ...SuccessLight.args,
        disabled: true
    }
};

export const Warning: Story = {
    args: {
        ...WithOnDismissCallback.args,
        variant: "warning"
    }
};

export const WarningDisabled: Story = {
    args: {
        ...Warning.args,
        disabled: true
    }
};

export const Destructive: Story = {
    args: {
        ...WithOnDismissCallback.args,
        variant: "destructive"
    }
};

export const DestructiveDisabled: Story = {
    args: {
        ...Destructive.args,
        disabled: true
    }
};

export const FullExample: Story = {
    args: WithOnDismissCallback.args,
    render: args => {
        return (
            <div className={"flex gap-sm"}>
                <Tag {...args} content={"Neutral base"} variant={"neutral-base"} />
                <Tag {...args} content={"Neutral base outline"} variant={"neutral-base-outline"} />
                <Tag {...args} content={"Neutral light"} variant={"neutral-light"} />
                <Tag {...args} content={"Neutral muted"} variant={"neutral-muted"} />
                <Tag {...args} content={"Neutral strong"} variant={"neutral-strong"} />
                <Tag {...args} content={"Neutral xstrong"} variant={"neutral-xstrong"} />
                <Tag {...args} content={"Neutral dark"} variant={"neutral-dark"} />
                <Tag {...args} content={"Success"} variant={"success"} />
                <Tag {...args} content={"Success light"} variant={"success-light"} />
                <Tag {...args} content={"Warning"} variant={"warning"} />
                <Tag {...args} content={"Destructive"} variant={"destructive"} />
                <Tag {...args} content={"Accent"} variant={"accent"} />
                <Tag {...args} content={"Accent light"} variant={"accent-light"} />
            </div>
        );
    }
};

export const Documentation: Story = {
    args: {
        content: "Label",
        variant: "neutral-base",
        disabled: false,
        onDismiss: undefined,
        dismissIconElement: undefined,
        dismissIconLabel: undefined
    },
    argTypes: {
        content: {
            description: "The content of the tag. Please refer to the example code for details.",
            control: "text"
        },
        variant: {
            description: "The color variant of the tag.",
            control: "select",
            options: [
                "neutral-base",
                "neutral-base-outline",
                "neutral-light",
                "neutral-muted",
                "neutral-strong",
                "neutral-xstrong",
                "neutral-dark",
                "success",
                "success-light",
                "warning",
                "destructive",
                "accent",
                "accent-light"
            ]
        },
        disabled: {
            description: "Whether the tag is disabled.",
            control: "boolean"
        },
        onDismiss: {
            description:
                "Callback function when the tag is dismissed. Please refer to the 'Dismissible Tag' example code for details."
        },
        dismissIconElement: {
            description:
                "Custom dismiss icon element. Please refer to the 'Custom Dismiss Icon' example code for details."
        },
        dismissIconLabel: {
            description:
                "Custom dismiss icon label. Please refer to the 'Custom Dismiss Icon' example code for details."
        }
    }
};
