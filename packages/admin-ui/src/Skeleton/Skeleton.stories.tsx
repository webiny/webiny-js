import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "./Skeleton.js";

const meta: Meta<typeof Skeleton> = {
    title: "Components/Skeleton",
    component: Skeleton,
    parameters: {
        layout: "padded"
    },
    argTypes: {
        type: {
            control: "select",
            options: ["text", "thumbnail", "area"]
        },
        size: {
            control: "select",
            options: ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"]
        },
        shade: {
            control: "select",
            options: ["dark", "light"]
        }
    }
};

export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {};

export const Text: Story = {
    args: {
        type: "text"
    }
};

export const Thumbnail: Story = {
    args: {
        type: "thumbnail"
    }
};

export const Area: Story = {
    args: {
        type: "area",
        className: "w-1/2 h-32"
    }
};

export const MultipleAreas: Story = {
    render: () => (
        <div className="flex gap-md">
            <div className="flex flex-col gap-md">
                <Skeleton type="area" className={"w-32 h-32"} />
                <Skeleton type="area" className={"w-32 h-32"} />
            </div>
            <div>
                <Skeleton type="area" className="w-32 h-full" />
            </div>
        </div>
    )
};

export const ExtraSmall: Story = {
    args: {
        size: "xs"
    }
};

export const Small: Story = {
    args: {
        size: "sm"
    }
};

export const Medium: Story = {
    args: {
        size: "md"
    }
};

export const Large: Story = {
    args: {
        size: "lg"
    }
};

export const ExtraLarge: Story = {
    args: {
        size: "xl"
    }
};

export const DoubleExtraLarge: Story = {
    args: {
        size: "xxl"
    }
};

export const TripleExtraLarge: Story = {
    args: {
        size: "3xl"
    }
};

export const Dark: Story = {
    args: {
        shade: "dark"
    }
};

export const Light: Story = {
    args: {
        shade: "light"
    }
};

export const Documentation: Story = {
    args: {
        type: "area",
        size: "lg",
        shade: "dark"
    },
    argTypes: {
        type: {
            control: "select",
            description: "The type of skeleton to display",
            options: ["text", "thumbnail", "area"]
        },
        size: {
            control: "select",
            description: "The size of the skeleton",
            options: ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"]
        },
        shade: {
            control: "select",
            description: "The shade of the skeleton",
            options: ["dark", "light"]
        }
    }
};
