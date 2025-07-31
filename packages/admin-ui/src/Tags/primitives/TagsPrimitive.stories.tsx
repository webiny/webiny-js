import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ReactComponent as TagIcon } from "@webiny/icons/tag.svg";
import { TagsPrimitive } from "./TagsPrimitive";
import { Button } from "~/Button";
import { Icon } from "~/Icon";

const meta: Meta<typeof TagsPrimitive> = {
    title: "Components/Form Primitives/Tags",
    component: TagsPrimitive,
    argTypes: {
        onChange: { action: "onChange" },
        onValueInput: { action: "onValueInput" },
        onValueAdd: { action: "onValueAdd" },
        onValueRemove: { action: "onValueRemove" },
        disabled: {
            control: "boolean",
            defaultValue: false
        }
    },
    parameters: {
        layout: "padded"
    },
    render: args => <TagsPrimitive {...args} />
};

export default meta;
type Story = StoryObj<typeof TagsPrimitive>;

export const Default: Story = {};

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
        ...Default.args,
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

export const WithCustomPlaceholder: Story = {
    args: {
        ...Default.args,
        placeholder: "Custom placeholder"
    }
};

export const WithStartIcon: Story = {
    args: {
        ...Default.args,
        startIcon: <Icon label={"Tag"} icon={<TagIcon />} />
    }
};

export const WithInitialValues: Story = {
    args: {
        ...Default.args,
        value: ["tag1", "tag2", "tag3"]
    }
};

export const WithProtectedValues: Story = {
    args: {
        ...Default.args,
        value: ["tag1", "tag2", "tag3", "another-tag1", "another-tag2"],
        protectedValues: ["tag1", "another-tag*"]
    }
};

export const WithExternalValueControl: Story = {
    args: {
        ...Default.args,
        value: ["tag1", "tag2", "tag3"]
    },
    render: args => {
        const [value, setValue] = React.useState<string[]>(args.value || []);

        return (
            <div className={"wby-w-full"}>
                <TagsPrimitive {...args} value={value} onChange={setValue} />
                <div className={"wby-mt-4 wby-text-center"}>
                    <Button text={"Reset"} onClick={() => setValue(args.value || [])} />
                </div>
                <div className={"wby-mt-4 wby-text-center"}>
                    Current selected values: {value?.join(",")}
                </div>
            </div>
        );
    }
};
