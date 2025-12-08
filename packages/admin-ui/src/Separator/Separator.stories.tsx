import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { Separator } from "./Separator.js";
import React from "react";
import { Heading } from "~/Heading/index.js";
import { Text } from "~/Text/index.js";

const meta: Meta<typeof Separator> = {
    title: "Components/Separator",
    component: Separator,
    argTypes: {},
    decorators: [
        Story => (
            <div className="w-[700px]">
                <Story />
            </div>
        )
    ]
};

export default meta;

type Story = StoryObj<typeof Separator>;

export const Documentation: Story = {
    args: {
        variant: "dimmed",
        margin: "none",
        orientation: "horizontal",
        decorative: true
    },
    argTypes: {
        margin: {
            description: "The margin around the separator.",
            control: "select",
            options: ["none", "xs", "sm", "md", "lg", "xl"]
        },
        variant: {
            description: "The visual style variant of the separator.",
            control: "select",
            options: ["transparent", "base", "dimmed", "muted", "strong", "accent"]
        },
        orientation: {
            description: "The orientation of the separator.",
            control: "select",
            options: ["horizontal", "vertical"]
        },
        decorative: {
            description:
                "Whether the separator is purely decorative and should be hidden from screen readers.",
            control: "boolean"
        }
    },
    render: props => {
        return (
            <div>
                <div className="space-y-1">
                    <Heading level={6}>{"This is a heading."}</Heading>
                    <Text size="sm" className={"text-neutral-strong"}>
                        {"This is a short description here"}
                    </Text>
                </div>
                <Separator
                    margin={props.margin}
                    variant={props.variant}
                    orientation={props.orientation}
                    decorative={props.decorative}
                />
                <div className="flex items-center h-6 text-sm">
                    <Text>{"This is text 1."}</Text>
                </div>
            </div>
        );
    }
};

export const Default: Story = {
    args: {
        variant: "dimmed",
        margin: "lg"
    },
    render: props => {
        return (
            <div>
                <div className="space-y-1">
                    <Heading level={6}>{"This is a heading."}</Heading>
                    <Text size="sm" className={"text-neutral-strong"}>
                        {"This is a short description here"}
                    </Text>
                </div>
                <Separator margin={props.margin} variant={props.variant} />
                <div className="flex items-center h-6 text-sm">
                    <Text>{"This is text 1."}</Text>
                </div>
            </div>
        );
    },
    argTypes: {
        margin: {
            control: "select",
            options: ["xs", "sm", "md", "lg", "xl"]
        },
        variant: {
            control: "select",
            options: ["transparent", "base", "dimmed", "muted", "strong", "accent"]
        }
    }
};

export const VerticalAndHorizontal: Story = {
    render: () => {
        return (
            <div>
                <div className="space-y-1">
                    <Heading level={6}>{"This is a heading."}</Heading>
                    <Text size="sm" className={"text-neutral-strong"}>
                        {"This is a short description here"}
                    </Text>
                </div>
                <Separator margin={"lg"} />
                <div className="flex items-center h-6 text-sm">
                    <Text>{"This is text 1."}</Text>
                    <Separator orientation="vertical" margin={"lg"} />
                    <Text>{"This is text 2."}</Text>
                    <Separator orientation="vertical" margin={"lg"} />
                    <Text>{"This is text 3."}</Text>
                </div>
            </div>
        );
    }
};

export const HorizontalOrientation: Story = {
    args: {
        orientation: "horizontal"
    },
    render: () => {
        return (
            <div>
                <div className="space-y-1">
                    <Heading level={6}>{"This is a heading."}</Heading>
                    <Text size="sm" className={"text-neutral-strong"}>
                        {"This is a short description here"}
                    </Text>
                </div>
                <Separator margin={"lg"} />
                <div className="flex items-center h-6 text-sm">
                    <Text>{"This is text 1."}</Text>
                </div>
            </div>
        );
    }
};

export const VerticalOrientation: Story = {
    args: {
        orientation: "vertical"
    },
    render: () => {
        return (
            <div className="flex justify-center h-6 text-sm">
                <Text>{"This is text 1."}</Text>
                <Separator orientation="vertical" margin={"lg"} />
                <Text>{"This is text 2."}</Text>
                <Separator orientation="vertical" margin={"lg"} />
                <Text>{"This is text 3."}</Text>
            </div>
        );
    }
};

export const LessMargin: Story = {
    render: () => {
        return (
            <div>
                <div className="space-y-1">
                    <Heading level={6}>{"This is a heading."}</Heading>
                    <Text size="sm" className={"text-neutral-strong"}>
                        {"This is a short description here"}
                    </Text>
                </div>
                <Separator margin={"md"} />
                <div className="flex items-center h-6 text-sm">
                    <Text>{"This is text 1."}</Text>
                    <Separator orientation="vertical" margin={"md"} />
                    <Text>{"This is text 2."}</Text>
                    <Separator orientation="vertical" margin={"md"} />
                    <Text>{"This is text 3."}</Text>
                </div>
            </div>
        );
    }
};

export const MoreMargin: Story = {
    render: () => {
        return (
            <div>
                <div className="space-y-1">
                    <Heading level={6}>{"This is a heading."}</Heading>
                    <Text size="sm" className={"text-neutral-strong"}>
                        {"This is a short description here"}
                    </Text>
                </div>
                <Separator margin={"xl"} />
                <div className="flex items-center h-6 text-sm">
                    <Text>{"This is text 1."}</Text>
                    <Separator orientation="vertical" margin={"xl"} />
                    <Text>{"This is text 2."}</Text>
                    <Separator orientation="vertical" margin={"xl"} />
                    <Text>{"This is text 3."}</Text>
                </div>
            </div>
        );
    }
};

export const Transparent: Story = {
    render: () => {
        return (
            <div>
                <div className="space-y-1">
                    <Heading level={6}>{"Transparent Variant"}</Heading>
                    <Text size="sm" className={"text-neutral-strong"}>
                        {"This separator is transparent and not visible"}
                    </Text>
                </div>
                <Separator margin={"lg"} variant="transparent" />
                <div className="flex items-center h-6 text-sm">
                    <Text>{"This is text 1."}</Text>
                </div>
            </div>
        );
    }
};

export const Base: Story = {
    render: () => {
        return (
            <div>
                <div className="space-y-1">
                    <Heading level={6}>{"Base Variant"}</Heading>
                    <Text size="sm" className={"text-neutral-strong"}>
                        {"This separator uses bg-white"}
                    </Text>
                </div>
                <Separator margin={"lg"} variant="base" />
                <div className="flex items-center h-6 text-sm">
                    <Text>{"This is text 1."}</Text>
                </div>
            </div>
        );
    }
};

export const Muted: Story = {
    render: () => {
        return (
            <div>
                <div className="space-y-1">
                    <Heading level={6}>{"Muted Variant"}</Heading>
                    <Text size="sm" className={"text-neutral-strong"}>
                        {"This separator uses bg-neutral-muted"}
                    </Text>
                </div>
                <Separator margin={"lg"} variant="muted" />
                <div className="flex items-center h-6 text-sm">
                    <Text>{"This is text 1."}</Text>
                </div>
            </div>
        );
    }
};

export const Strong: Story = {
    render: () => {
        return (
            <div>
                <div className="space-y-1">
                    <Heading level={6}>{"Strong Variant"}</Heading>
                    <Text size="sm" className={"text-neutral-strong"}>
                        {"This separator uses bg-neutral-strong"}
                    </Text>
                </div>
                <Separator margin={"lg"} variant="strong" />
                <div className="flex items-center h-6 text-sm">
                    <Text>{"This is text 1."}</Text>
                </div>
            </div>
        );
    }
};

export const Accent: Story = {
    render: () => {
        return (
            <div>
                <div className="space-y-1">
                    <Heading level={6}>{"Accent Variant"}</Heading>
                    <Text size="sm" className={"text-neutral-strong"}>
                        {"This separator uses bg-primary"}
                    </Text>
                </div>
                <Separator margin={"lg"} variant="accent" />
                <div className="flex items-center h-6 text-sm">
                    <Text>{"This is text 1."}</Text>
                </div>
            </div>
        );
    }
};

export const AllVariants: Story = {
    render: () => {
        return (
            <div className="space-y-8">
                <div>
                    <Heading level={6}>{"Transparent"}</Heading>
                    <Separator margin={"lg"} variant="transparent" />
                    <Text size="sm">{"Not visible"}</Text>
                </div>
                <div>
                    <Heading level={6}>{"Base"}</Heading>
                    <Separator margin={"lg"} variant="base" />
                    <Text size="sm">{"bg-white"}</Text>
                </div>
                <div>
                    <Heading level={6}>{"Dimmed (default)"}</Heading>
                    <Separator margin={"lg"} variant="dimmed" />
                    <Text size="sm">{"bg-neutral-dimmed"}</Text>
                </div>
                <div>
                    <Heading level={6}>{"Muted"}</Heading>
                    <Separator margin={"lg"} variant="muted" />
                    <Text size="sm">{"bg-neutral-muted"}</Text>
                </div>
                <div>
                    <Heading level={6}>{"Strong"}</Heading>
                    <Separator margin={"lg"} variant="strong" />
                    <Text size="sm">{"bg-neutral-strong"}</Text>
                </div>
                <div>
                    <Heading level={6}>{"Accent"}</Heading>
                    <Separator margin={"lg"} variant="accent" />
                    <Text size="sm">{"bg-primary"}</Text>
                </div>
            </div>
        );
    }
};
