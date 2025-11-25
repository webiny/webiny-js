import React from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { Widget } from "./Widget.js";
import { Button } from "~/Button/index.js";
import { DropdownMenu } from "~/DropdownMenu/index.js";
import { ReactComponent as NotificationIcon } from "@webiny/icons/notifications_active.svg";
import { Tabs } from "~/Tabs/index.js";
import { ReactComponent as HistoryIcon } from "@webiny/icons/history.svg";

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
        info: (
            <>
                Learn more about this <a href={"#"}>here</a>.
            </>
        ),
        children: (
            <>
                The amazing, splendid, and most useful umbrella, resistant to rain and friendly to
                winds, is something that deserves all admiration. Crafted with perfect textures, it
                bravely withstands storms and gently shades the rays of the sun. A remarkable
                innovation, with an ergonomically designed grip most suited to the hand, it remains
                stable even in the fiercest weather.
            </>
        ),
        actions: (
            <>
                <Widget.CancelAction />
                <Widget.ConfirmAction />
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

export const WithOutlineAccent: Story = {
    args: {
        ...Default.args,
        outline: true,
        variant: "accent"
    }
};

export const WithOutlineLight: Story = {
    args: {
        ...Default.args,
        outline: true,
        variant: "light"
    }
};

export const WithActions: Story = {
    args: {
        ...Default.args
    }
};
export const WithHeaderActions: Story = {
    args: {
        ...Default.args,
        actionsPosition: "header"
    }
};

export const WithSmallHeaderActions: Story = {
    args: {
        ...Default.args,
        actionsPosition: "header",
        actionsSize: "sm"
    }
};


export const AccentVariant: Story = {
    args: {
        ...Default.args,
        className: "max-w-[406px]",
        variant: "accent",
        title: "Pages",
        icon: <Widget.Icon icon={<HistoryIcon />} label={"Pages icon"} />,
        description: null,
        children: <>Build stunning landing pages with an easy-to-use drag and drop editor.</>
    }
};

export const DropdownMenuInWidget: Story = {
    args: {
        ...Default.args,
        children: (
            <>
                <DropdownMenu trigger={<Button variant="primary" text={"Open"} />}>
                    <DropdownMenu.Item text={"Billing"} />
                    <DropdownMenu.Item text={"Settings"} />
                    <DropdownMenu.Item text={"Keyboard shortcuts"} />
                </DropdownMenu>
            </>
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

export const WithTabs: Story = {
    args: {
        ...Default.args,
        bodyPadding: false,
        icon: <Widget.Icon icon={<NotificationIcon />} label={"Title icon"} />,
        children: (
            <>
                <Tabs
                    className={"w-[500px]"}
                    separator={true}
                    spacing={"lg"}
                    tabs={[
                        <Tabs.Tab
                            key={"account"}
                            value={"account"}
                            trigger={"Account"}
                            content={"Make changes to your account here."}
                        />,
                        <Tabs.Tab
                            key={"company"}
                            value={"company"}
                            trigger={"Company"}
                            content={"Make changes to your company info here."}
                        />,
                        <Tabs.Tab
                            key={"security"}
                            value={"security"}
                            trigger={"Security"}
                            content={"Make changes to your security settings here."}
                        />,
                        <Tabs.Tab
                            key={"development"}
                            value={"development"}
                            trigger={"Development"}
                            content={"Make changes to your development settings here."}
                        />
                    ]}
                />
            </>
        )
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
        actions: (
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
        actions: {
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

