import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as ChevronRight } from "@webiny/icons/chevron_right.svg";
import { SelectPrimitive } from "./SelectPrimitive";
import { Button } from "~/Button";

const meta: Meta<typeof SelectPrimitive> = {
    title: "Components/Form Primitives/Select",
    component: SelectPrimitive,
    argTypes: {
        onChange: { action: "onChange" },
        onOpenChange: { action: "onOpenChange" },
        variant: { control: "select", options: ["primary", "secondary", "ghost"] },
        size: { control: "select", options: ["md", "lg", "xl"] },
        disabled: { control: "boolean" },
        invalid: { control: "boolean" }
    },
    parameters: {
        layout: "padded"
    },
    render: args => {
        const [value, setValue] = useState(args.value);
        return (
            <div className={"wby-w-full"}>
                <SelectPrimitive {...args} value={value} onChange={setValue} />
                <div className={"wby-mt-4 wby-text-center"}>
                    Current selected value: <pre>{value}</pre>
                </div>
            </div>
        );
    }
};

export default meta;

type Story = StoryObj<typeof SelectPrimitive>;

export const Default: Story = {
    args: {
        options: [
            "Eastern Standard Time (EST)",
            "Central Standard Time (CST)",
            "Pacific Standard Time (PST)",
            "Greenwich Mean Time (GMT)",
            "Central European Time (CET)",
            "Central Africa Time (CAT)",
            "India Standard Time (IST)",
            "China Standard Time (CST)",
            "Japan Standard Time (JST)",
            "Australian Western Standard Time (AWST)",
            "New Zealand Standard Time (NZST)",
            "Fiji Time (FJT)",
            "Argentina Time (ART)",
            "Bolivia Time (BOT)",
            "Brasilia Time (BRT)"
        ]
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

export const WithCustomPlaceholder: Story = {
    args: {
        ...Default.args,
        placeholder: "Custom placeholder"
    }
};

export const WithStartIcon: Story = {
    args: {
        ...Default.args,
        startIcon: <SearchIcon />
    }
};

export const WithEndIconIcon: Story = {
    args: {
        ...Default.args,
        endIcon: <SearchIcon />
    }
};

export const WithStartAndEndIcons: Story = {
    args: {
        ...Default.args,
        startIcon: <SearchIcon />,
        endIcon: <ChevronRight />
    }
};

export const WithoutResetAction: Story = {
    args: {
        ...Default.args,
        displayResetAction: false
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

export const WithFormattedOptions: Story = {
    args: {
        ...Default.args,
        options: [
            { label: "Eastern Standard Time (EST)", value: "est" },
            { label: "Central Standard Time (CST)", value: "cst" },
            { label: "Pacific Standard Time (PST)", value: "pst" },
            { label: "Greenwich Mean Time (GMT)", value: "gmt" },
            { label: "Central European Time (CET)", value: "cet" },
            { label: "Central Africa Time (CAT)", value: "cat" },
            { label: "India Standard Time (IST)", value: "ist" },
            { label: "China Standard Time (CST)", value: "cst_china" },
            { label: "Japan Standard Time (JST)", value: "jst" },
            { label: "Australian Western Standard Time (AWST)", value: "awst" },
            { label: "New Zealand Standard Time (NZST)", value: "nzst" },
            { label: "Fiji Time (FJT)", value: "fjt" },
            { label: "Argentina Time (ART)", value: "art" },
            { label: "Bolivia Time (BOT)", value: "bot" },
            { label: "Brasilia Time (BRT)", value: "brt" }
        ]
    }
};

export const WithOptionGroups: Story = {
    args: {
        ...Default.args,
        options: [
            {
                label: "North America",
                options: [
                    { label: "Eastern Standard Time (EST)", value: "est" },
                    { label: "Central Standard Time (CST)", value: "cst" },
                    { label: "Pacific Standard Time (PST)", value: "pst" }
                ]
            },
            {
                label: "Europe & Africa",
                options: [
                    { label: "Greenwich Mean Time (GMT)", value: "gmt" },
                    { label: "Central European Time (CET)", value: "cet" },
                    { label: "Central Africa Time (CAT)", value: "cat" }
                ]
            },
            {
                label: "Asia",
                options: [
                    { label: "India Standard Time (IST)", value: "ist" },
                    { label: "China Standard Time (CST)", value: "cst_china" },
                    { label: "Japan Standard Time (JST)", value: "jst" }
                ]
            },
            {
                label: "Australia & Pacific",
                options: [
                    { label: "Australian Western Standard Time (AWST)", value: "awst" },
                    { label: "New Zealand Standard Time (NZST)", value: "nzst" },
                    { label: "Fiji Time (FJT)", value: "fjt" }
                ]
            },
            {
                label: "South America",
                options: [
                    { label: "Argentina Time (ART)", value: "art" },
                    { label: "Bolivia Time (BOT)", value: "bot" },
                    { label: "Brasilia Time (BRT)", value: "brt" }
                ]
            }
        ]
    }
};

export const WithSeparators: Story = {
    args: {
        ...Default.args,
        options: [
            { label: "Eastern Standard Time (EST)", value: "est" },
            { label: "Central Standard Time (CST)", value: "cst" },
            { label: "Pacific Standard Time (PST)", value: "pst", separator: true },
            { label: "Greenwich Mean Time (GMT)", value: "gmt" },
            { label: "Central European Time (CET)", value: "cet" },
            { label: "Central Africa Time (CAT)", value: "cat", separator: true },
            { label: "India Standard Time (IST)", value: "ist" },
            { label: "China Standard Time (CST)", value: "cst_china" },
            { label: "Japan Standard Time (JST)", value: "jst", separator: true },
            { label: "Australian Western Standard Time (AWST)", value: "awst" },
            { label: "New Zealand Standard Time (NZST)", value: "nzst" },
            { label: "Fiji Time (FJT)", value: "fjt", separator: true },
            { label: "Argentina Time (ART)", value: "art" },
            { label: "Bolivia Time (BOT)", value: "bot" },
            { label: "Brasilia Time (BRT)", value: "brt" }
        ]
    }
};

export const WithDisabledOptions: Story = {
    args: {
        options: [
            { label: "Eastern Standard Time (EST)", value: "est", disabled: true },
            { label: "Central Standard Time (CST)", value: "cst", disabled: true },
            { label: "Pacific Standard Time (PST)", value: "pst", disabled: true },
            { label: "Greenwich Mean Time (GMT)", value: "gmt" },
            { label: "Central European Time (CET)", value: "cet" },
            { label: "Central Africa Time (CAT)", value: "cat" },
            { label: "India Standard Time (IST)", value: "ist" },
            { label: "China Standard Time (CST)", value: "cst_china" },
            { label: "Japan Standard Time (JST)", value: "jst" },
            { label: "Australian Western Standard Time (AWST)", value: "awst" },
            { label: "New Zealand Standard Time (NZST)", value: "nzst" },
            { label: "Fiji Time (FJT)", value: "fjt" },
            { label: "Argentina Time (ART)", value: "art" },
            { label: "Bolivia Time (BOT)", value: "bot" },
            { label: "Brasilia Time (BRT)", value: "brt" }
        ]
    }
};

export const WithExternalValueControl: Story = {
    args: {
        ...Default.args,
        options: [
            "Eastern Standard Time (EST)",
            "Central Standard Time (CST)",
            "Pacific Standard Time (PST)",
            "Greenwich Mean Time (GMT)",
            "Central European Time (CET)",
            "Central Africa Time (CAT)",
            "India Standard Time (IST)",
            "China Standard Time (CST)",
            "Japan Standard Time (JST)",
            "Australian Western Standard Time (AWST)",
            "New Zealand Standard Time (NZST)",
            "Fiji Time (FJT)",
            "Argentina Time (ART)",
            "Bolivia Time (BOT)",
            "Brasilia Time (BRT)"
        ]
    },
    render: args => {
        const [value, setValue] = useState(args.value);
        return (
            <div className={"wby-w-full"}>
                <div>
                    <SelectPrimitive {...args} value={value} onChange={value => setValue(value)} />
                </div>
                <div className={"wby-mt-4 wby-text-center"}>
                    <Button text={"Reset"} onClick={() => setValue(undefined)} />
                </div>
                <div className={"wby-mt-4 wby-text-center"}>
                    Current selected value: <pre>{value}</pre>
                </div>
            </div>
        );
    }
};
