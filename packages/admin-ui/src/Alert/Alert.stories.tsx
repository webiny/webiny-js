import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { Alert } from "./Alert.js";
import React from "react";
import { ReactComponent as LifeBuoyIcon } from "@webiny/icons/safety_check.svg";

const meta: Meta<typeof Alert> = {
    title: "Components/Alert",
    component: Alert,
    argTypes: {},
    decorators: [
        Story => (
            <div className="w-[700px]">
                <Story />
            </div>
        )
    ]
};

export default meta;

type Story = StoryObj<typeof Alert>;

export const Default: Story = {
    args: {
        children: "This is an alert. Play around with different properties to see how it looks."
    },
    argTypes: {
        type: {
            control: "select",
            options: ["info", "success", "warning", "danger"]
        },
        variant: {
            control: "select",
            options: ["strong", "subtle"]
        }
    }
};

export const Info: Story = {
    args: {
        ...Default.args,
        type: "info",
        children: (
            <>
                This type of notification is suitable for general usage where there’s no need for
                accent. And <a href={"#"}>this thing here</a> is a short link.
            </>
        )
    }
};

export const InfoStrong: Story = {
    name: "Info (strong)",
    args: {
        ...Info.args,
        variant: "strong",
        children: (
            <>
                This type of notification is suitable for general usage where there is a need for
                strong accent. And <a href={"#"}>this thing here</a> is a short link.
            </>
        )
    }
};

export const Success: Story = {
    args: {
        ...Default.args,
        type: "success",
        children: (
            <>
                This is a success alert, used when something occurred successfully. And{" "}
                <a href={"#"}>this thing here</a> is a short link.
            </>
        )
    }
};

export const SuccessStrong: Story = {
    name: "Success (strong)",
    args: {
        ...Success.args,
        variant: "strong",
        children: (
            <>
                This is a success alert, used when something occurred successfully and needs to be
                prominent. And <a href={"#"}>this thing here</a> is a short link.
            </>
        )
    }
};

export const Warning: Story = {
    args: {
        ...Default.args,
        children: (
            <>
                This is a warning alert, used when something of strong relevance needs to be
                communicated. And <a href={"#"}>this thing here</a> is a short link.
            </>
        ),
        type: "warning"
    }
};

export const WarningStrong: Story = {
    name: "Warning (strong)",
    args: {
        ...Warning.args,
        children: (
            <>
                This is a warning alert, used when something of strong relevance needs to be
                prominently communicated. And <a href={"#"}>this thing here</a> is a short link.
            </>
        ),
        variant: "strong"
    }
};

export const Danger: Story = {
    args: {
        ...Default.args,
        children: (
            <>
                This is a danger alert, used when something critical needs to be communicated. And{" "}
                <a href={"#"}>this thing here</a> is a short link.
            </>
        ),
        type: "danger"
    }
};

export const DangerStrong: Story = {
    name: "Danger (strong)",
    args: {
        ...Danger.args,
        children: (
            <>
                This is a danger alert, used when something critical needs to be prominently
                communicated. And <a href={"#"}>this thing here</a> is a short link.
            </>
        ),
        variant: "strong"
    }
};

export const WithCustomIcon: Story = {
    args: {
        ...Default.args,
        children: <>An alert that can be closed.</>,
        icon: <LifeBuoyIcon />
    }
};

export const WithNoIcon: Story = {
    args: {
        ...Default.args,
        children: <>An alert that can be closed.</>,
        icon: null
    }
};

export const WithCloseButton: Story = {
    args: {
        ...Default.args,
        children: <>An alert that can be closed.</>,
        showCloseButton: true,
        onClose: () => alert("Close button clicked.")
    }
};

export const WithAction: Story = {
    args: {
        ...WithCloseButton.args,
        children: <>An alert that can be closed and also has action button.</>,
        showCloseButton: true,
        actions: (
            <Alert.Action text={"Button"} onClick={() => alert("Custom action button clicked.")} />
        )
    }
};

export const WithSwatchColor: Story = {
    args: {
        ...WithCloseButton.args,
        children: <>An alert that can be closed and also has action button.</>,
        swatchColor: "#FF708F",
        actions: (
            <>
                <Alert.Action
                    text={"Reject"}
                    onClick={() => alert("Custom action button clicked.")}
                />
                <Alert.Action
                    text={"Approve"}
                    onClick={() => alert("Custom action button clicked.")}
                />
            </>
        )
    }
};

export const WithSwatchColorNoIcon: Story = {
    name: "With Swatch Color & No Icon",
    args: {
        ...WithCloseButton.args,
        children: <>An alert that can be closed and also has action button.</>,
        swatchColor: "#2AABF6",
        icon: null,
        actions: (
            <>
                <Alert.Action
                    text={"Reject"}
                    onClick={() => alert("Custom action button clicked.")}
                />
                <Alert.Action
                    text={"Approve"}
                    onClick={() => alert("Custom action button clicked.")}
                />
            </>
        )
    }
};
export const WithSwatchColorNoSwatchIcon: Story = {
    name: "With Swatch Color & No Swatch Icon",
    args: {
        ...WithCloseButton.args,
        children: <>An alert that can be closed and also has action button.</>,
        swatchColor: "#BDDE46",
        swatchColorIcon: false,
        actions: (
            <>
                <Alert.Action
                    text={"Reject"}
                    onClick={() => alert("Custom action button clicked.")}
                />
                <Alert.Action
                    text={"Approve"}
                    onClick={() => alert("Custom action button clicked.")}
                />
            </>
        )
    }
};

export const Documentation: Story = {
    args: {
        type: "info",
        variant: "subtle",
        showCloseButton: false,
        children: (
            <>
                This type of notification is suitable for general usage where there’s no need for
                accent. And <a href={"#"}>this thing here</a> is a short link.
            </>
        ),
        onClose: () => {},
        actions: undefined
    },
    argTypes: {
        type: {
            description: "Type",
            control: "select",
            options: ["info", "success", "warning", "danger"],
            defaultValue: "info"
        },
        variant: {
            description: "Variant",
            control: "select",
            options: ["subtle", "strong"],
            defaultValue: "subtle"
        },
        showCloseButton: {
            description:
                "Show close button, please refer to the 'With Close Button' example below for details.",
            control: "boolean",
            defaultValue: false
        },
        onClose: {
            description: "Please refer to the 'With Close Button' example below for details."
        },
        actions: {
            description: "Please refer to the 'With Action' example below for details."
        }
    }
};
