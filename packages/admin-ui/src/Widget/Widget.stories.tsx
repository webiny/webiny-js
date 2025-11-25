import React from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { Widget } from "./Widget.js";
import { Button } from "~/Button/index.js";
import { List } from "~/List/index.js";
import { ReactComponent as NotificationIcon } from "@webiny/icons/notifications_active.svg";
import { ReactComponent as ArrowForwardIcon } from "@webiny/icons/arrow_forward.svg";
import { Tabs } from "~/Tabs/index.js";
import { ReactComponent as HistoryIcon } from "@webiny/icons/history.svg";
import { ReactComponent as PlusIcon } from "@webiny/icons/add.svg";
import { ReactComponent as ManageSearchIcon } from "@webiny/icons/manage_search.svg";

const meta: Meta<typeof Widget> = {
    title: "Components/Widget",
    component: Widget,
    argTypes: {},
    decorators: [
        Story => (
            <div className="bg-[#f9fafa] p-[50px] rounded-[5px] max-w-[800px] text-neutral-dimmed">
                <Story />
            </div>
        )
    ]
};

export default meta;

type Story = StoryObj<typeof Widget>;

export const Default: Story = {
    args: {
        padding: "md",
        title: "Widget Title",
        description: "A short widget description.",
        children: (
            <>
                The amazing, splendid, and most useful umbrella, resistant to rain and friendly to
                winds, is something that deserves all admiration. Crafted with perfect textures, it
                bravely withstands storms and gently shades the rays of the sun. A remarkable
                innovation, with an ergonomically designed grip most suited to the hand, it remains
                stable even in the fiercest weather.
            </>
        )
    },
    argTypes: {}
};

export const PaddingSmall: Story = {
    args: {
        ...Default.args,
        padding: "sm"
    }
};

export const PaddingMedium: Story = {
    args: {
        ...Default.args,
        padding: "md"
    }
};

export const WithOutline: Story = {
    args: {
        ...Default.args,
        outline: true
    }
};

export const WithFooterStartActions: Story = {
    args: {
        ...Default.args
    }
};

export const WithFooterEndActions: Story = {
    args: {
        ...Default.args,
        footerStartActions: undefined,
        footerEndActions: <Button variant="primary" text={"Action"} />
    }
};

export const WithBothFooterActions: Story = {
    args: {
        ...Default.args,
        footerEndActions: <Widget.Action>Save</Widget.Action>
    }
};

export const AccentVariant: Story = {
    args: {
        ...Default.args,
        className: "w-[406px]",
        variant: "accent",
        title: "Pages",
        icon: <Widget.Icon icon={<HistoryIcon />} label={"Pages icon"} />,
        description: null,
        children: <>Build stunning landing pages with an easy-to-use drag and drop editor.</>,
        footerStartActions: (
            <>
                <Widget.Action icon={<PlusIcon />}>New Page</Widget.Action>
                <Widget.Action icon={<PlusIcon />}>New Template</Widget.Action>
            </>
        )
    }
};

export const LightVariant: Story = {
    args: {
        variant: "light",
        className: "w-[406px]",
        title: "Need some assistance?",
        icon: <Widget.Icon icon={<NotificationIcon />} label={"Help icon"} />,
        padding: "md",
        children: (
            <List variant="container" background={"base"} className="flex flex-col gap-y-sm">
                <List.Item
                    title="Start Webiny tour"
                    description="Let us show you around. You pick what you..."
                    actions={<List.Item.Action icon={<ArrowForwardIcon />} />}
                />
                <List.Item
                    title="Documentation"
                    description="Explore the Webiny documentation, learn a..."
                    actions={<List.Item.Action icon={<ArrowForwardIcon />} />}
                />
                <List.Item
                    title="Contact us"
                    description="Contact Sales, Explore Partnerships or Sla..."
                    actions={<List.Item.Action icon={<ArrowForwardIcon />} />}
                />
            </List>
        )
    }
};

export const BaseVariant: Story = {
    args: {
        variant: "base",
        className: "w-[657px]",
        title: "Review Requests",
        icon: <Widget.Icon icon={<ManageSearchIcon />} label={"Review icon"} />,
        headerActions: <Widget.Action>View All</Widget.Action>,
        padding: "md",
        bodyPadding: false,
        outline: true,
        children: (
            <Tabs
                separator={true}
                spacing={"lg"}
                tabs={[
                    <Tabs.Tab
                        key={"inReview"}
                        value={"inReview"}
                        trigger={"In Review (8)"}
                        content={
                            <>
                                <List
                                    variant="container"
                                    background={"light"}
                                    className="flex flex-col gap-y-sm"
                                >
                                    <List.Item
                                        title="Page: Product Group"
                                        description="Marketing review Sven Al Hamad, 2 days ago"
                                        colorMark="#ef4444"
                                    />
                                    <List.Item
                                        title="Article: Region"
                                        description="Legal review Sven Al Hamad, 2 days ago"
                                        colorMark="#ef4444"
                                    />
                                    <List.Item
                                        title="Article: Organization"
                                        description="Specialist review Sven Al Hamad, 2 days ago"
                                        colorMark="#3b82f6"
                                    />
                                    <List.Item
                                        title="Product Group: Products"
                                        description="Marketing review Sven Al Hamad, 2 days ago"
                                        colorMark="#eab308"
                                    />
                                    <List.Item
                                        title="Page: Product Group"
                                        description="Marketing review Sven Al Hamad, 2 days ago"
                                        colorMark="#eab308"
                                    />
                                </List>
                            </>
                        }
                    />,
                    <Tabs.Tab
                        key={"approved"}
                        value={"approved"}
                        trigger={"Approved"}
                        content={<>No review requests approved yet.</>}
                    />
                ]}
            />
        )
    }
};

export const WithSmallElevation: Story = {
    args: {
        ...Default.args,
        elevation: "small"
    }
};

export const WithMediumElevation: Story = {
    args: {
        ...Default.args,
        elevation: "medium"
    }
};

export const WithLargeElevation: Story = {
    args: {
        ...Default.args,
        elevation: "large"
    }
};

export const WithIcon: Story = {
    args: {
        ...Default.args,
        icon: <Widget.Icon icon={<NotificationIcon />} label={"Title icon"} />
    }
};

export const Documentation: Story = {
    render: args => {
        return <Widget {...args} />;
    },
    args: {
        title: "Widget title goes here",
        description: "Widget description goes here",
        children: <>This is widget content. Anything can go in here.</>,
        footerStartActions: (
            <>
                <Button variant={"secondary"} text={"Cancel"} />
                <Button variant={"primary"} text={"Confirm"} />
            </>
        ),
        padding: "sm",
        elevation: "small"
    },
    argTypes: {
        title: {
            description: "The title displayed at the top of the widget",
            control: "text"
        },
        description: {
            description: "A description displayed below the title",
            control: "text"
        },
        children: {
            description:
                "The main content of the widget. Please refer to the example code for details on usage."
        },
        footerEndActions: {
            description:
                "Buttons or other interactive elements displayed at the bottom of the widget. Please refer to the example code for details on usage."
        },
        padding: {
            description: "Controls the amount of padding inside the widget",
            control: "select",
            options: ["none", "standard", "comfortable"]
        },
        elevation: {
            description: "Controls the shadow depth of the widget",
            control: "select",
            options: ["none", "xs", "sm", "md", "lg", "xl"]
        }
    }
};
