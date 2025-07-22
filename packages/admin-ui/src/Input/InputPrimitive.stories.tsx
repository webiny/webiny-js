import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ReactComponent as NotificationsIcon } from "@webiny/icons/notifications.svg";
import { ReactComponent as CalendarIcon } from "@webiny/icons/calendar_month.svg";

import { InputPrimitive } from "./InputPrimitive";
import { Icon } from "~/Icon";

const meta: Meta<typeof InputPrimitive> = {
    title: "Components/Form Primitives/Input",
    component: InputPrimitive,
    argTypes: {
        onChange: { action: "onChange" },
        onEnter: { action: "onEnter" },
        onKeyDown: { action: "onKeyDown" },
        type: {
            control: "select",
            options: [
                "text",
                "number",
                "email",
                "password",
                "tel",
                "url",
                "search",
                "date",
                "datetime-local",
                "month",
                "week",
                "time",
                "color",
                "file",
                "checkbox",
                "radio",
                "range",
                "hidden",
                "button",
                "submit",
                "reset",
                "image"
            ],
            defaultValue: "text"
        }
    },
    parameters: {
        layout: "padded"
    },
    render: args => {
        const [value, setValue] = useState(args.value);
        return (
            <div className={"wby-w-full"}>
                <InputPrimitive {...args} value={value} onChange={setValue} />
                <div className={"wby-mt-4 wby-text-center"}>
                    Current selected value: <pre>{value}</pre>
                </div>
            </div>
        );
    }
};

export default meta;
type Story = StoryObj<typeof InputPrimitive>;

export const Default: Story = {};

export const MediumSize: Story = {
    args: {
        placeholder: "Custom placeholder",
        size: "md"
    }
};

export const LargeSize: Story = {
    args: {
        placeholder: "Custom placeholder",
        size: "lg"
    }
};

export const ExtraLargeSize: Story = {
    args: {
        placeholder: "Custom placeholder",
        size: "xl"
    }
};

export const WithStartIcon: Story = {
    args: {
        placeholder: "Custom placeholder",
        startIcon: <Icon label={"Bell"} icon={<NotificationsIcon />} />
    }
};

export const WithEndIcon: Story = {
    args: {
        placeholder: "Custom placeholder",
        endIcon: <Icon label={"Calendar"} icon={<CalendarIcon />} />
    }
};

export const WithStartAndEndIcons: Story = {
    args: {
        placeholder: "Custom placeholder",
        startIcon: <Icon label={"Bell"} icon={<NotificationsIcon />} />,
        endIcon: <Icon label={"Calendar"} icon={<CalendarIcon />} />
    }
};

export const PrimaryVariant: Story = {
    args: {
        ...WithStartAndEndIcons.args,
        variant: "primary",
        placeholder: "Custom placeholder"
    }
};

export const PrimaryVariantDisabled: Story = {
    args: {
        ...PrimaryVariant.args,
        disabled: true
    }
};

export const PrimaryVariantInvalid: Story = {
    args: {
        ...PrimaryVariant.args,
        invalid: true
    }
};

export const SecondaryVariant: Story = {
    args: {
        ...WithStartAndEndIcons.args,
        variant: "secondary",
        placeholder: "Custom placeholder"
    }
};

export const SecondaryVariantDisabled: Story = {
    args: {
        ...SecondaryVariant.args,
        disabled: true
    }
};

export const SecondaryVariantInvalid: Story = {
    args: {
        ...SecondaryVariant.args,
        invalid: true
    }
};

export const GhostVariant: Story = {
    args: {
        ...WithStartAndEndIcons.args,
        variant: "ghost",
        placeholder: "Custom placeholder"
    }
};

export const GhostVariantDisabled: Story = {
    args: {
        ...GhostVariant.args,
        disabled: true
    }
};

export const GhostVariantInvalid: Story = {
    args: {
        ...GhostVariant.args,
        invalid: true
    }
};

export const GhostNegativeVariant: Story = {
    args: {
        ...WithStartAndEndIcons.args,
        variant: "ghost-negative",
        placeholder: "Custom placeholder"
    },
    decorators: [
        Story => (
            <div className="wby-bg-neutral-dark wby-text-neutral-light wby-p-xl">
                <Story />
            </div>
        )
    ]
};

export const GhostNegativeVariantDisabled: Story = {
    args: {
        ...GhostNegativeVariant.args,
        disabled: true
    },
    decorators: [
        Story => (
            <div className="wby-bg-neutral-dark wby-text-neutral-light wby-p-xl">
                <Story />
            </div>
        )
    ]
};

export const GhostNegativeVariantInvalid: Story = {
    args: {
        ...GhostNegativeVariant.args,
        invalid: true
    },
    decorators: [
        Story => (
            <div className="wby-bg-neutral-dark wby-text-neutral-light wby-p-xl">
                <Story />
            </div>
        )
    ]
};

export const WithForwardEventOnChange: Story = {
    args: {
        ...Default.args,
        forwardEventOnChange: true
    }
};
