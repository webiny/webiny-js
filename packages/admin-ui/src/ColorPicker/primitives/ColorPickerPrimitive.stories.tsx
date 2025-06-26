import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ColorPickerPrimitive } from "./ColorPickerPrimitive";

const meta: Meta<typeof ColorPickerPrimitive> = {
    title: "Components/Form Primitives/ColorPicker",
    component: ColorPickerPrimitive,
    argTypes: {
        onChange: { action: "onChange" },
        onChangeComplete: { action: "onChangeComplete" },
        onOpenChange: { action: "onOpenChange" }
    },
    parameters: {
        layout: "padded"
    },
    render: args => {
        const [value, setValue] = useState(args.value);
        return (
            <div className={"wby-w-full"}>
                <div className={"wby-flex wby-items-center wby-justify-center wby-mb-4"}>
                    <ColorPickerPrimitive
                        {...args}
                        value={value}
                        onChange={value => console.log("Value changed:", value)}
                        onChangeComplete={value => {
                            console.log("Value change complete:", value);
                            setValue(value);
                        }}
                    />
                </div>
                <div className={"wby-text-center"}>
                    Current selected value: <pre>{value}</pre>
                </div>
            </div>
        );
    }
};

export default meta;
type Story = StoryObj<typeof ColorPickerPrimitive>;

export const Default: Story = {};

export const MediumSize: Story = {
    args: {
        size: "md"
    }
};

export const LargeSize: Story = {
    args: {
        size: "lg"
    }
};

export const ExtraLargeSize: Story = {
    args: {
        size: "xl"
    }
};

export const PrimaryVariant: Story = {
    args: {
        variant: "primary"
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
        variant: "secondary"
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
        variant: "ghost"
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

export const WithDefaultValue: Story = {
    args: {
        ...Default.args,
        value: "#ff0000"
    }
};

export const WithStartAlign: Story = {
    args: {
        ...Default.args,
        align: "start"
    }
};

export const WithCenterAlign: Story = {
    args: {
        ...Default.args,
        align: "center"
    }
};

export const WithEndAlign: Story = {
    args: {
        ...Default.args,
        align: "end"
    }
};
