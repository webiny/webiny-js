import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CheckboxGroupPrimitive } from "./CheckboxGroupPrimitive.js";
import { Button } from "~/Button/index.js";

const meta: Meta<typeof CheckboxGroupPrimitive> = {
    title: "Components/Form Primitives/CheckboxGroup",
    component: CheckboxGroupPrimitive,
    parameters: {
        layout: "padded"
    },
    render: args => {
        const [values, setValues] = useState(args.value);
        return (
            <div className={"w-full"}>
                <CheckboxGroupPrimitive
                    {...args}
                    value={values}
                    onChange={values => setValues(values)}
                />
                <div className={"mt-4 text-center"}>
                    Current selected value: <pre>{values && values.join()}</pre>
                </div>
            </div>
        );
    }
};

export default meta;
type Story = StoryObj<typeof CheckboxGroupPrimitive>;

export const Default: Story = {
    args: {
        items: [
            {
                label: "Value 1",
                value: "value-1"
            },
            {
                label: "Value 2",
                value: "value-2"
            },
            {
                label: "Value 3",
                value: "value-3"
            }
        ],
        value: []
    }
};

export const WithLongLabels: Story = {
    args: {
        items: [
            {
                label: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent eu aliquam lacus. Morbi eleifend, eros et vestibulum lobortis, mi elit scelerisque neque, sit amet dictum orci sem ac ante. In hac habitasse platea dictumst. Pellentesque molestie nisl tortor, eu dictum velit mollis vitae. Integer consectetur id diam eget iaculis. Praesent egestas ullamcorper libero vel eleifend.",
                value: "value-1"
            },
            {
                label: "Ut pretium ex vel auctor bibendum. In hac habitasse platea dictumst. Etiam varius felis mi, eu sagittis erat congue vel. Phasellus dui eros, dignissim quis quam pulvinar, tincidunt venenatis felis.",
                value: "value-2"
            },
            {
                label: "Nullam gravida consequat volutpat. Ut faucibus imperdiet lobortis. Nullam tempus accumsan metus, vel fermentum lacus dignissim vitae. Sed vitae nunc ante. Cras sollicitudin id dolor sit amet imperdiet.",
                value: "value-3"
            }
        ],
        value: []
    }
};

export const WithSelectedValues: Story = {
    args: {
        items: [
            {
                label: "Value 1",
                value: "value-1"
            },
            {
                label: "Value 2",
                value: "value-2"
            },
            {
                label: "Value 3",
                value: "value-3"
            }
        ],
        value: ["value-2"]
    }
};

export const WithDisabledValue: Story = {
    args: {
        items: [
            {
                label: "Value 1",
                value: "value-1"
            },
            {
                label: "Value 2",
                value: "value-2",
                disabled: true
            },
            {
                label: "Value 3",
                value: "value-3"
            }
        ],
        value: ["value-2"]
    }
};

export const WithExternalValueControl: Story = {
    args: {
        ...Default.args
    },
    render: args => {
        const [values, setValues] = useState(args.value);
        return (
            <div className={"w-full"}>
                <div>
                    <CheckboxGroupPrimitive
                        {...args}
                        value={values}
                        onChange={values => setValues(values)}
                    />
                </div>
                <div className={"mt-4 text-center"}>
                    <Button text={"Reset"} onClick={() => setValues([])} />
                </div>
                <div className={"mt-4 text-center"}>
                    Current selected value: <pre>{values && values.join()}</pre>
                </div>
            </div>
        );
    }
};

export const WithNumericValues: Story = {
    args: {
        ...Default.args,
        value: [3, 4],
        items: [
            {
                label: "Number 1",
                value: 1
            },
            {
                label: "Number 2",
                value: 2
            },
            {
                label: "Number 3",
                value: 3
            },
            {
                label: "Number 4",
                value: 4
            },
            {
                label: "Number 5",
                value: 5
            }
        ]
    }
};
