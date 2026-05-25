import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { addDays, nextSaturday } from "date-fns";
import { DatePicker } from "./DatePicker.js";

const meta: Meta<typeof DatePicker> = {
    title: "Components/Form/DatePicker",
    component: DatePicker,
    argTypes: {
        onChange: { action: "onChange" },
        type: {
            control: "select",
            options: [
                "date",
                "time",
                "dateTimeLocal",
                "dateTimeTz",
                "month",
                "week",
                "year",
                "dateRange",
                "multipleDates",
                "multipleMonths",
                "multipleYears"
            ],
            defaultValue: "date"
        },
        disabled: {
            control: "boolean",
            defaultValue: false
        }
    },
    parameters: {
        layout: "padded"
    },
    render: args => {
        const [value, setValue] = useState<any>();
        return <DatePicker {...args} value={value} onChange={setValue} />;
    }
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {
    args: {
        type: "date"
    }
};

export const WithLabel: Story = {
    args: {
        type: "date",
        label: "Any field label"
    }
};

export const WithLabelRequired: Story = {
    args: {
        type: "date",
        label: "Any field label",
        required: true
    }
};

export const WithDescription: Story = {
    args: {
        type: "date",
        description: "Provide the required information for processing your request."
    }
};

export const WithNotes: Story = {
    args: {
        type: "date",
        note: "Note: Ensure your selection or input is accurate before proceeding."
    }
};

export const WithErrors: Story = {
    args: {
        type: "date",
        validation: {
            isValid: false,
            message: "This field is required."
        }
    }
};

export const Disabled: Story = {
    args: {
        type: "date",
        label: "Any field label",
        disabled: true
    }
};

export const FullExample: Story = {
    args: {
        type: "date",
        label: "Any field label",
        required: true,
        description: "Provide the required information for processing your request.",
        note: "Note: Ensure your selection or input is accurate before proceeding.",
        validation: {
            isValid: false,
            message: "This field is required."
        }
    }
};

export const WithPresets: Story = {
    render: args => {
        const [value, setValue] = useState<string | undefined>();
        const presets = [
            { label: "Today", value: () => new Date() },
            { label: "Tomorrow", value: () => addDays(new Date(), 1) },
            { label: "In 3 days", value: () => addDays(new Date(), 3) },
            { label: "In a week", value: () => addDays(new Date(), 7) },
            { label: "In 2 weeks", value: () => addDays(new Date(), 14) },
            { label: "Next Saturday", value: () => nextSaturday(new Date()) }
        ];
        return (
            <DatePicker {...args} type="date" value={value} onChange={setValue} presets={presets} />
        );
    },
    args: {
        label: "Pick a date",
        description: "Choose a date or use a preset."
    }
};

export const TypeTime: Story = {
    render: args => {
        const [value, setValue] = useState<string | undefined>();
        return <DatePicker {...args} type="time" value={value} onChange={setValue} />;
    },
    args: {
        label: "Time"
    }
};

export const TypeDateTimeLocal: Story = {
    render: args => {
        const [value, setValue] = useState<string | undefined>();
        return <DatePicker {...args} type="dateTimeLocal" value={value} onChange={setValue} />;
    },
    args: {
        label: "Date & Time (local)"
    }
};

export const TypeDateTimeTz: Story = {
    render: args => {
        const [value, setValue] = useState<string | undefined>();
        return <DatePicker {...args} type="dateTimeTz" value={value} onChange={setValue} />;
    },
    args: {
        label: "Date & Time (with timezone)"
    }
};

export const TypeMonth: Story = {
    render: args => {
        const [value, setValue] = useState<string | undefined>();
        return <DatePicker {...args} type="month" value={value} onChange={setValue} />;
    },
    args: {
        label: "Month"
    }
};

export const TypeWeek: Story = {
    render: args => {
        const [value, setValue] = useState<string | undefined>();
        return <DatePicker {...args} type="week" value={value} onChange={setValue} />;
    },
    args: {
        label: "Week"
    }
};

export const TypeYear: Story = {
    render: args => {
        const [value, setValue] = useState<number | undefined>();
        return (
            <DatePicker
                {...args}
                type="year"
                value={value}
                onChange={setValue}
                yearRange={[2015, 2035]}
            />
        );
    },
    args: {
        label: "Year"
    }
};

export const TypeDateRange: Story = {
    render: args => {
        const [value, setValue] = useState<{ from?: string; to?: string } | undefined>();
        return <DatePicker {...args} type="dateRange" value={value} onChange={setValue} />;
    },
    args: {
        label: "Date Range"
    }
};

export const TypeMultipleDates: Story = {
    render: args => {
        const [value, setValue] = useState<string[]>([]);
        return <DatePicker {...args} type="multipleDates" value={value} onChange={setValue} />;
    },
    args: {
        label: "Multiple Dates"
    }
};

export const TypeMultipleMonths: Story = {
    render: args => {
        const [value, setValue] = useState<string[]>([]);
        return <DatePicker {...args} type="multipleMonths" value={value} onChange={setValue} />;
    },
    args: {
        label: "Multiple Months"
    }
};

export const TypeMultipleYears: Story = {
    render: args => {
        const [value, setValue] = useState<number[]>([]);
        return (
            <DatePicker
                {...args}
                type="multipleYears"
                value={value}
                onChange={setValue}
                yearRange={[2015, 2035]}
            />
        );
    },
    args: {
        label: "Multiple Years"
    }
};

const formatValue = (value: any): string => {
    if (value === undefined || value === null) {
        return "undefined";
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (Array.isArray(value)) {
        return JSON.stringify(
            value.map((v: any) => (v instanceof Date ? v.toISOString() : v)),
            null,
            2
        );
    }
    if (typeof value === "object") {
        return JSON.stringify(value, (_k, v) => (v instanceof Date ? v.toISOString() : v), 2);
    }
    return String(value);
};

const DocumentationInner = (args: any) => {
    const isMultiple = (args.type as string)?.startsWith("multiple");
    const [value, setValue] = useState<any>(isMultiple ? [] : undefined);
    const [validation, setValidation] = useState({ isValid: true, message: "" });

    const handleChange = (newValue: any) => {
        setValue(newValue);
        const isEmpty =
            newValue === undefined ||
            newValue === null ||
            newValue === "" ||
            (Array.isArray(newValue) && newValue.length === 0);
        if (args.required && isEmpty) {
            setValidation({ isValid: false, message: "This field is required" });
        } else {
            setValidation({ isValid: true, message: "" });
        }
    };

    return (
        <div>
            <DatePicker {...args} value={value} onChange={handleChange} validation={validation} />
            <div className="mt-md rounded-md border-sm border-neutral-muted bg-neutral-light p-sm">
                <div className="text-xs font-medium text-neutral-dimmed mb-xs">Current value</div>
                <pre className="text-sm text-neutral-strong whitespace-pre-wrap m-0">
                    {formatValue(value)}
                </pre>
            </div>
        </div>
    );
};

export const Documentation: Story = {
    render: args => {
        return <DocumentationInner key={args.type as string} {...args} />;
    },
    args: {
        type: "date",
        label: "Event Date",
        required: true,
        disabled: false,
        description: "Select the date for your event",
        note: "Note: Choose a date that works for all participants",
        placeholder: "Pick a date",
        validation: undefined
    },
    argTypes: {
        type: {
            description: "The type of date picker variant to render",
            control: "select",
            options: [
                "date",
                "time",
                "dateTimeLocal",
                "dateTimeTz",
                "month",
                "week",
                "year",
                "dateRange",
                "multipleDates",
                "multipleMonths",
                "multipleYears"
            ],
            defaultValue: "date"
        },
        label: {
            description: "Label text displayed above the picker",
            control: "text"
        },
        required: {
            description: "Makes the field required",
            control: "boolean",
            defaultValue: true
        },
        disabled: {
            description: "Disables the date picker",
            control: "boolean",
            defaultValue: false
        },
        description: {
            description: "Helper text displayed below the label",
            control: "text"
        },
        note: {
            description: "Additional note displayed below the picker",
            control: "text"
        },
        placeholder: {
            description: "Placeholder text shown when no date is selected",
            control: "text"
        },
        validation: {
            description:
                "Object containing validation state and message. Please refer to the example code for details on usage."
        },
        onChange: {
            description: "Callback function when the value changes"
        }
    }
};
