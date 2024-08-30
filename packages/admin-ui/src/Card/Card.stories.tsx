import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Card, CardContent, CardFooter, CardTitle, CardDescription } from "./Card";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Card> = {
    title: "Components/Card",
    component: Card,
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Card>;


// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const WithHeaderAndFooter: Story = {
    args: {
        headerTitle: <CardTitle>This is a card title</CardTitle>,
        headerDescription: <CardDescription>This is a card description</CardDescription>,
        content: <CardContent>This is card content. Anything can go in here.</CardContent>,
        footer: <CardFooter>This is a card footer.</CardFooter>,
    }
};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const WithoutHeaderAndFooter: Story = {
    args: {
        content: <CardContent>This is card content. Anything can go in here.</CardContent>,
    }
};