import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Card, CardContent, CardFooter, CardHeader } from "./Card";

const meta: Meta<typeof Card> = {
    title: "Components/Card",
    component: Card,
    tags: ["autodocs"]
};

export default meta;

type Story = StoryObj<typeof Card>;

const defaultContentProps = {
    header: <CardHeader title="This is a card title" description="This is a card description" />,
    content: <CardContent content={"This is card content. Anything can go in here."} />,
    footer: <CardFooter content={"This is card footer. Anything can go in here."} />
};

export const Default: Story = {
    args: {
        ...defaultContentProps,
        padding: "standard",
        elevation: "none",
        borderRadius: "md"
    },
    argTypes: {
        padding: {
            control: "select",
            options: ["none", "standard", "comfortable"]
        },
        elevation: {
            control: "select",
            options: ["none", "xs", "sm", "md", "lg", "xl"]
        },
        borderRadius: {
            control: "select",
            options: ["none", "sm", "md", "lg"]
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
        header: (
            <CardHeader
                title="This is a card that can be closed."
                description="This is a description of a card that can be closed."
                showCloseButton
            />
        )
    }
};

export const WithMorePadding: Story = {
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

export const NoBorderRadius: Story = {
    args: {
        ...defaultContentProps,
        borderRadius: "none"
    }
};

export const WithCustomHeader: Story = {
    args: {
        ...defaultContentProps,
        header: (
            <CardHeader
                content={
                    <>
                        <div>
                            Custom header title in a <code>div</code>
                        </div>
                        <span>
                            Custom header description in a <code>span</code>
                        </span>
                    </>
                }
            />
        )
    }
};
