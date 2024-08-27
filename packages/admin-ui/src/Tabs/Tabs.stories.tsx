import type { Meta, StoryObj } from "@storybook/react";

import { Tabs, TabsContent, TabsTrigger } from "./Tabs";
import * as React from "react";

const meta: Meta<typeof Tabs> = {
    title: "Components/Tabs",
    component: Tabs,
    tags: ["autodocs"],
    argTypes: {
        size: { control: "select", options: ["sm", "md", "lg", "xl"] }
    }
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
    args: {
        triggers: [
            <TabsTrigger key="account" value="account">
                Account
            </TabsTrigger>,
            <TabsTrigger key="password" value="password">
                Password
            </TabsTrigger>
        ],
        contents: [
            <TabsContent key="account" value="account">
                Make changes to your account here.
            </TabsContent>,
            <TabsContent key="password" value="password">
                Change your password here.
            </TabsContent>
        ]
    }
};
