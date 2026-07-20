import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState.js";
import { Button } from "~/Button/index.js";

const meta: Meta<typeof EmptyState> = {
    title: "Components/EmptyState",
    component: EmptyState,
    parameters: {
        layout: "padded"
    },
    argTypes: {
        type: {
            control: "select",
            options: ["content", "table", "listing", "layout", "upload", "select"]
        },
        size: {
            control: "select",
            options: ["sm", "md", "lg"]
        },
        illustration: {
            control: "boolean"
        }
    }
};

export default meta;

type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
    args: {
        title: "Nothing to show",
        description: "There are no entries available."
    }
};

export const WithActions: Story = {
    args: {
        type: "upload",
        title: "No files uploaded yet",
        description: "Upload your first file to get started.",
        actions: (
            <>
                <Button variant={"primary"} text={"Upload file"} />
                <Button variant={"secondary"} text={"Learn more"} />
            </>
        )
    }
};

export const DescriptionOnly: Story = {
    args: {
        type: "table",
        description: "There are no entries available."
    }
};

export const WithoutIllustration: Story = {
    args: {
        illustration: false,
        title: "Nothing to show",
        description: "There are no entries available."
    }
};

export const Small: Story = {
    args: {
        size: "sm",
        type: "listing",
        title: "Nothing to show",
        description: "There are no entries available."
    }
};

export const Large: Story = {
    args: {
        size: "lg",
        type: "content",
        title: "This is an optional title.",
        description:
            "This is a description zone where you can add text as supporting content. You can also use the description zone without a title if needed."
    }
};

export const Types: Story = {
    render: () => (
        <div className={"grid grid-cols-3 gap-md"}>
            {(["content", "table", "listing", "layout", "upload", "select"] as const).map(type => (
                <EmptyState key={type} type={type} title={type} description={`Type: ${type}`} />
            ))}
        </div>
    )
};

export const Documentation: Story = {
    args: {
        type: "content",
        size: "md",
        title: "Nothing to show",
        description: "There are no entries available."
    },
    argTypes: {
        type: {
            control: "select",
            description: "The illustration that matches the empty context",
            options: ["content", "table", "listing", "layout", "upload", "select"]
        },
        size: {
            control: "select",
            description: "The size of the empty state",
            options: ["sm", "md", "lg"]
        }
    }
};
