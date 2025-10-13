import React from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { ReactComponent as MoreVertical } from "@webiny/icons/more_vert.svg";
import { Card } from "./Card.js";
import { Button, IconButton } from "~/Button/index.js";
import { Icon } from "~/Icon/index.js";

const meta: Meta<typeof Card> = {
    title: "Components/Card",
    component: Card,
    decorators: [
        Story => (
            <div className="bg-[#f4f4f4] h-[500px] w-[700px] rounded-[5px] px-[50px] content-center">
                <div className={"m-auto w-[300px]"}>
                    <Story />
                </div>
            </div>
        )
    ]
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
    args: {
        title: "Card title goes here",
        description: "Card description goes here",
        children: <>This is card content. Anything can go in here.</>,
        actions: (
            <>
                <Button variant={"secondary"} text={"Cancel"} />
                <Button variant={"primary"} text={"Confirm"} />
            </>
        ),
        padding: "standard",
        elevation: "sm",
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

export const NoTitleDescriptionActionsHeaderAndFooter: Story = {
    name: "Only Body (Without Body, Title, Actions)",
    args: {
        children: <>This is card content. Anything can go in here.</>
    }
};

export const WithMorePadding: Story = {
    args: {
        ...Default.args,
        actions: null,
        padding: "comfortable"
    }
};

export const WithMoreElevation: Story = {
    args: {
        ...Default.args,
        actions: null,
        elevation: "md"
    }
};

export const NoElevation: Story = {
    args: {
        ...Default.args,
        actions: null,
        elevation: "none"
    }
};

export const NoBorderRadius: Story = {
    args: {
        ...Default.args,
        actions: null,
        borderRadius: "none"
    }
};

export const WithOptions: Story = {
    args: {
        ...Default.args,
        actions: null,
        options: (
            <IconButton
                variant={"ghost"}
                icon={<Icon icon={<MoreVertical />} label={"More options"} />}
                size={"sm"}
                iconSize={"lg"}
                onClick={() => alert("Custom action button clicked.")}
            />
        )
    }
};

export const WithActions: Story = {
    args: Default.args
};

export const Documentation: Story = {
    render: args => {
        return <Card {...args} />;
    },
    args: {
        title: "Card title goes here",
        description: "Card description goes here",
        children: <>This is card content. Anything can go in here.</>,
        actions: (
            <>
                <Button variant={"secondary"} text={"Cancel"} />
                <Button variant={"primary"} text={"Confirm"} />
            </>
        ),
        padding: "standard",
        elevation: "sm",
        borderRadius: "md",
        options: (
            <IconButton
                variant={"ghost"}
                icon={<Icon icon={<MoreVertical />} label={"More options"} />}
                size={"sm"}
                iconSize={"lg"}
                onClick={() => alert("Custom action button clicked.")}
            />
        )
    },
    argTypes: {
        title: {
            description: "The title displayed at the top of the card",
            control: "text"
        },
        description: {
            description: "A description displayed below the title",
            control: "text"
        },
        children: {
            description:
                "The main content of the card. Please refer to the example code for details on usage."
        },
        actions: {
            description:
                "Buttons or other interactive elements displayed at the bottom of the card. Please refer to the example code for details on usage."
        },
        options: {
            description:
                "Additional options or actions displayed in the top-right corner. Please refer to the example code for details on usage."
        },
        padding: {
            description: "Controls the amount of padding inside the card",
            control: "select",
            options: ["none", "standard", "comfortable"]
        },
        elevation: {
            description: "Controls the shadow depth of the card",
            control: "select",
            options: ["none", "xs", "sm", "md", "lg", "xl"]
        },
        borderRadius: {
            description: "Controls the roundness of the card corners",
            control: "select",
            options: ["none", "sm", "md", "lg"]
        }
    }
};
