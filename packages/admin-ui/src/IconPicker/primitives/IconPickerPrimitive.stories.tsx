import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { IconPickerPrimitive } from "./IconPickerPrimitive.js";

const meta: Meta<typeof IconPickerPrimitive> = {
    title: "Components/Form Primitives/IconPicker",
    component: IconPickerPrimitive,
    argTypes: {
        onChange: { action: "onChange" }
    },
    render: args => {
        const [value, setValue] = useState(args.value);
        return (
            <div className={"w-full"}>
                <IconPickerPrimitive {...args} value={value} onChange={setValue} />
                <div className={"mt-4 text-center"}>
                    Current selected value: <pre>{value}</pre>
                </div>
            </div>
        );
    },
    parameters: {
        layout: "padded"
    }
};

library.add(fas);

export default meta;
type Story = StoryObj<typeof IconPickerPrimitive>;

export const Default: Story = {
    args: {
        icons: [
            { prefix: "fas", name: "trash-restore-alt" },
            { prefix: "fas", name: "trash-can-arrow-up" },
            { prefix: "fas", name: "naira-sign" },
            { prefix: "fas", name: "cart-arrow-down" },
            { prefix: "fas", name: "walkie-talkie" },
            { prefix: "fas", name: "file-edit" },
            { prefix: "fas", name: "file-pen" },
            { prefix: "fas", name: "receipt" },
            { prefix: "fas", name: "pen-square" },
            { prefix: "fas", name: "pencil-square" },
            { prefix: "fas", name: "square-pen" },
            { prefix: "fas", name: "suitcase-rolling" },
            { prefix: "fas", name: "person-circle-exclamation" },
            { prefix: "fas", name: "chevron-down" },
            { prefix: "fas", name: "battery" },
            { prefix: "fas", name: "battery-5" },
            { prefix: "fas", name: "battery-full" },
            { prefix: "fas", name: "skull-crossbones" },
            { prefix: "fas", name: "code-compare" },
            { prefix: "fas", name: "list-dots" },
            { prefix: "fas", name: "list-ul" },
            { prefix: "fas", name: "school-lock" },
            { prefix: "fas", name: "tower-cell" },
            { prefix: "fas", name: "long-arrow-alt-down" },
            { prefix: "fas", name: "down-long" },
            { prefix: "fas", name: "ranking-star" },
            { prefix: "fas", name: "chess-king" },
            { prefix: "fas", name: "person-harassing" },
            { prefix: "fas", name: "brazilian-real-sign" },
            { prefix: "fas", name: "landmark-alt" },
            { prefix: "fas", name: "landmark-dome" },
            { prefix: "fas", name: "arrow-up" },
            { prefix: "fas", name: "television" },
            { prefix: "fas", name: "tv-alt" },
            { prefix: "fas", name: "tv" },
            { prefix: "fas", name: "shrimp" },
            { prefix: "fas", name: "tasks" },
            { prefix: "fas", name: "list-check" },
            { prefix: "fas", name: "jug-detergent" },
            { prefix: "fas", name: "user-circle" },
            { prefix: "fas", name: "circle-user" },
            { prefix: "fas", name: "user-shield" },
            { prefix: "fas", name: "wind" },
            { prefix: "fas", name: "car-crash" },
            { prefix: "fas", name: "car-burst" },
            { prefix: "fas", name: "y" },
            { prefix: "fas", name: "snowboarding" },
            { prefix: "fas", name: "person-snowboarding" },
            { prefix: "fas", name: "shipping-fast" },
            { prefix: "fas", name: "truck-fast" }
        ]
    }
};

export const WithDefaultValue: Story = {
    args: {
        ...Default.args,
        value: "fas/panorama"
    }
};

export const MediumSize: Story = {
    args: {
        ...Default.args,
        size: "md"
    }
};

export const LargeSize: Story = {
    args: {
        ...Default.args,
        size: "lg"
    }
};

export const ExtraLargeSize: Story = {
    args: {
        ...Default.args,
        size: "xl"
    }
};

export const PrimaryVariant: Story = {
    args: {
        ...Default.args,
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
        ...Default.args,
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
        ...Default.args,
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
