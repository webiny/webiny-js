import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { AutoCompletePrimitive } from "./AutoCompletePrimitive";
import { Button } from "~/Button";
import { Icon } from "~/Icon";

const meta: Meta<typeof AutoCompletePrimitive> = {
    title: "Components/Form Primitives/Autocomplete",
    component: AutoCompletePrimitive,
    parameters: {
        layout: "padded"
    },
    argTypes: {
        onValueChange: { action: "onValueChange" },
        onOpenChange: { action: "onOpenChange" }
    },
    render: args => {
        const [value, setValue] = useState(args.value);
        return (
            <div className={"wby-w-full"}>
                <AutoCompletePrimitive {...args} value={value} onValueChange={setValue} />
                <div className={"wby-mt-4 wby-text-center"}>
                    Current selected value: <pre>{value}</pre>
                </div>
            </div>
        );
    }
};

export default meta;

type Story = StoryObj<typeof AutoCompletePrimitive>;

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

export const WithStartIcon: Story = {
    args: {
        ...Default.args,
        startIcon: <Icon label={"Search"} icon={<SearchIcon />} />
    }
};

export const WithLoading: Story = {
    args: {
        ...Default.args,
        loading: true
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
        ...Default.args,
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

export const WithPredefinedValue: Story = {
    args: {
        ...Default.args,
        value: "Eastern Standard Time (EST)"
    }
};

export const WithCustomPlaceholder: Story = {
    args: {
        ...Default.args,
        placeholder: "Custom placeholder"
    }
};

export const WithCustomEmptyMessage: Story = {
    args: {
        ...Default.args,
        emptyMessage: "Custom empty message"
    }
};

export const WithCustomInitialMessage: Story = {
    args: {
        ...Default.args,
        initialMessage: "Custom initial message.",
        options: []
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

export const WithCustomOptionRenderer: Story = {
    args: {
        ...Default.args,
        options: [
            {
                label: "Eastern Standard Time (EST)",
                value: "est",
                item: {
                    name: "Eastern Standard Time (EST)",
                    time_difference: "-5:00",
                    flag: "🇺🇸"
                }
            },
            {
                label: "Central Standard Time (CST)",
                value: "cst",
                item: {
                    name: "Central Standard Time (CST)",
                    time_difference: "-6:00",
                    flag: "🇺🇸"
                }
            },
            {
                label: "Pacific Standard Time (PST)",
                value: "pst",
                item: {
                    name: "Pacific Standard Time (PST)",
                    time_difference: "-8:00",
                    flag: "🇺🇸"
                }
            },
            {
                label: "Greenwich Mean Time (GMT)",
                value: "gmt",
                item: {
                    name: "Greenwich Mean Time (GMT)",
                    time_difference: "±0:00",
                    flag: "🇬🇧"
                }
            },
            {
                label: "Central European Time (CET)",
                value: "cet",
                item: {
                    name: "Central European Time (CET)",
                    time_difference: "+1:00",
                    flag: "🇪🇺"
                }
            },
            {
                label: "Central Africa Time (CAT)",
                value: "cat",
                item: {
                    name: "Central Africa Time (CAT)",
                    time_difference: "+2:00",
                    flag: "🇿🇦"
                }
            },
            {
                label: "India Standard Time (IST)",
                value: "ist",
                item: {
                    name: "India Standard Time (IST)",
                    time_difference: "+5:30",
                    flag: "🇮🇳"
                }
            },
            {
                label: "China Standard Time (CST)",
                value: "cst_china",
                item: {
                    name: "China Standard Time (CST)",
                    time_difference: "+8:00",
                    flag: "🇨🇳"
                }
            },
            {
                label: "Japan Standard Time (JST)",
                value: "jst",
                item: {
                    name: "Japan Standard Time (JST)",
                    time_difference: "+9:00",
                    flag: "🇯🇵"
                }
            },
            {
                label: "Australian Western Standard Time (AWST)",
                value: "awst",
                item: {
                    name: "Australian Western Standard Time (AWST)",
                    time_difference: "+8:00",
                    flag: "🇦🇺"
                }
            },
            {
                label: "New Zealand Standard Time (NZST)",
                value: "nzst",
                item: {
                    name: "New Zealand Standard Time (NZST)",
                    time_difference: "+12:00",
                    flag: "🇳🇿"
                }
            },
            {
                label: "Fiji Time (FJT)",
                value: "fjt",
                item: {
                    name: "Fiji Time (FJT)",
                    time_difference: "+12:00",
                    flag: "🇫🇯"
                }
            },
            {
                label: "Argentina Time (ART)",
                value: "art",
                item: {
                    name: "Argentina Time (ART)",
                    time_difference: "-3:00",
                    flag: "🇦🇷"
                }
            },
            {
                label: "Bolivia Time (BOT)",
                value: "bot",
                item: {
                    name: "Bolivia Time (BOT)",
                    time_difference: "-4:00",
                    flag: "🇧🇴"
                }
            },
            {
                label: "Brasilia Time (BRT)",
                value: "brt",
                item: {
                    name: "Brasilia Time (BRT)",
                    time_difference: "-3:00",
                    flag: "🇧🇷"
                }
            }
        ],
        optionRenderer: item => {
            return (
                <div className={"wby-w-full wby-flex wby-justify-between wby-align-middle"}>
                    <div>
                        <span className={"wby-mr-sm"}>{item.flag}</span>
                        {item.name}
                    </div>
                    <div className={"wby-text-sm"}>{item.time_difference}</div>
                </div>
            );
        }
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
    },
    render: args => {
        const [value, setValue] = useState(args.value);
        return (
            <div className={"wby-w-full"}>
                <div>
                    <AutoCompletePrimitive
                        {...args}
                        value={value}
                        onValueChange={value => setValue(value)}
                    />
                </div>
                <div className={"wby-mt-4 wby-text-center"}>
                    <Button text={"Reset"} onClick={() => setValue("")} />
                </div>
                <div className={"wby-mt-4 wby-text-center"}>
                    Current selected value: <pre>{value}</pre>
                </div>
            </div>
        );
    }
};
