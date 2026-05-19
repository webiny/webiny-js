import React from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { TimeAgo } from "./TimeAgo.js";

const meta: Meta<typeof TimeAgo> = {
    title: "Components/TimeAgo",
    component: TimeAgo
};

export default meta;

type Story = StoryObj<typeof TimeAgo>;

export const JustNow: Story = {
    args: {
        datetime: new Date()
    }
};

export const SecondsAgo: Story = {
    name: "Seconds ago",
    args: {
        datetime: new Date(Date.now() - 45 * 1000)
    }
};

export const MinutesAgo: Story = {
    name: "Minutes ago",
    args: {
        datetime: new Date(Date.now() - 15 * 60 * 1000)
    }
};

export const HoursAgo: Story = {
    name: "Hours ago",
    args: {
        datetime: new Date(Date.now() - 3 * 60 * 60 * 1000)
    }
};

export const DaysAgo: Story = {
    name: "Days ago",
    args: {
        datetime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
};

export const WeeksAgo: Story = {
    name: "Weeks ago",
    args: {
        datetime: new Date(Date.now() - 3 * 7 * 24 * 60 * 60 * 1000)
    }
};

export const MonthsAgo: Story = {
    name: "Months ago",
    args: {
        datetime: new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000)
    }
};

export const YearsAgo: Story = {
    name: "Years ago",
    args: {
        datetime: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
    }
};

export const ISOString: Story = {
    name: "From ISO string",
    args: {
        datetime: "2024-01-15T12:00:00Z"
    }
};

export const NotLive: Story = {
    name: "Live updates disabled",
    args: {
        datetime: new Date(),
        live: false
    }
};
