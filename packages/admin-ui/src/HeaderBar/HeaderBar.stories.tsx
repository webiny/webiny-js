import type { Meta, StoryObj } from "@storybook/react";
import { ReactComponent as KeyboardArrowRightIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { HeaderBar } from "./HeaderBar.js";
import React from "react";
import { Button, IconButton } from "~/Button/index.js";
import { Avatar } from "~/Avatar/index.js";
import { Text } from "~/Text/index.js";

const meta: Meta<typeof HeaderBar> = {
    title: "Components/HeaderBar",
    component: HeaderBar,
    decorators: [
        Story => (
            <div className="bg-[#f4f4f4] h-[500px] w-[850px]  rounded-[5px] px-[50px] content-center">
                <Story />
            </div>
        )
    ]
};

export default meta;

type Story = StoryObj<typeof HeaderBar>;

const StartExample = () => (
    <Text size={"sm"} className={"text-neutral-dimmed"}>
        {"Headless CMS / Articles / The best article ever"}
    </Text>
);

const MiddleExample = () => <>Content in the middle</>;

const EndExample = () => (
    <div className={"flex gap-x-sm"}>
        <Button variant={"ghost"} size={"md"} text={"Root tenant"} />
        <div className={"flex items-center rounded-md gap-xxs py-xs px-xs bg-neutral-light"}>
            <Avatar
                size={"sm"}
                variant={"strong"}
                image={<Avatar.Image src={"https://i.pravatar.cc/300"} />}
                fallback={<Avatar.Fallback delayMs={0}>W</Avatar.Fallback>}
            />
            <IconButton
                variant={"ghost"}
                size={"xs"}
                color={"neutral-strong"}
                icon={<KeyboardArrowRightIcon />}
                onClick={() => console.log("clicked")}
            />
        </div>
    </div>
);

export const Default: Story = {
    args: {
        start: <StartExample />,
        middle: <MiddleExample />,
        end: <EndExample />
    }
};

export const StartContentOnly: Story = {
    args: {
        start: <StartExample />
    }
};

export const MiddleContentOnly: Story = {
    args: {
        middle: <MiddleExample />
    }
};

export const EndContentOnly: Story = {
    args: {
        end: <EndExample />
    }
};

export const StartEndContentOnly: Story = {
    args: {
        start: <StartExample />,
        end: <EndExample />
    }
};

export const MoreStartContent: Story = {
    args: {
        start: (
            <>
                <StartExample />
                <StartExample />
                <StartExample />
            </>
        ),
        middle: <MiddleExample />,
        end: <EndExample />
    }
};

export const Documentation: Story = {
    args: {
        start: <StartExample />,
        middle: <MiddleExample />,
        end: <EndExample />
    },
    argTypes: {
        start: {
            description: "Content displayed at the start of the header bar"
        },
        middle: {
            description: "Content displayed in the middle of the header bar"
        },
        end: {
            description: "Content displayed at the end of the header bar"
        }
    }
};
