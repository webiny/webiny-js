import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Card, CardContent, CardFooter } from "./Card";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Card> = {
    title: "Components/Card",
    component: Card,
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ["autodocs"]
};

export default meta;

type Story = StoryObj<typeof Card>;

const defaultContentProps = {
    headerTitle: "This is a card title",
    headerDescription: "This is a card description",
    content: <>This is card content. Anything can go in here.</>,
    footer: <>This is a card footer.</>
};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
    args: {
        ...defaultContentProps,
        showCloseButton: false,
        padding: "standard",
        elevation: "none"
    },
    argTypes: {
        padding: {
            control: "select",
            options: ["none", "standard", "comfortable"]
        },
        elevation: {
            control: "select",
            options: ["none", "xs", "sm", "md", "lg", "xl"]
        }
    }
};

export const WithoutHeaderAndFooter: Story = {
    args: {
        content: <>This is card content. Anything can go in here.</>
    }
};

export const WithCloseButton: Story = {
    args: {
        ...defaultContentProps,
        showCloseButton: true
    }
};

export const WithPadding: Story = {
    args: {
        ...defaultContentProps,
        padding: "comfortable"
    }
};

export const WithElevation: Story = {
    args: {
        ...defaultContentProps,
        elevation: "md"
    }
};
export const WithCustomHeader: Story = {
    args: {
        ...defaultContentProps,
        headerTitle: (
            <div>
                Custom header title in a <code>div</code>
            </div>
        ),
        headerDescription: (
            <span>
                Custom header description in a <code>span</code>
            </span>
        )
    }
};
