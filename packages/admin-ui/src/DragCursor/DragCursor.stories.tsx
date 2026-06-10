import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ReactComponent as TextIcon } from "@webiny/icons/text_fields.svg";
import { ReactComponent as ImageIcon } from "@webiny/icons/image.svg";
import { ReactComponent as ButtonIcon } from "@webiny/icons/smart_button.svg";
import { DragCursor } from "./DragCursor.js";

const meta: Meta<typeof DragCursor> = {
    title: "Components/DragCursor",
    component: DragCursor,
    parameters: {
        layout: "padded"
    },
    argTypes: {
        label: { control: "text" },
        isOverSlot: { control: "boolean" },
        icon: { control: false }
    }
};

export default meta;
type Story = StoryObj<typeof DragCursor>;

export const OnDrag: Story = {
    args: {
        label: "Header",
        icon: <TextIcon />,
        isOverSlot: false
    }
};

export const OnSlot: Story = {
    args: {
        ...OnDrag.args,
        isOverSlot: true
    }
};

export const NoIcon: Story = {
    args: {
        label: "Header",
        isOverSlot: false
    }
};

export const NoIconOnSlot: Story = {
    args: {
        ...NoIcon.args,
        isOverSlot: true
    }
};

export const AllVariants: Story = {
    args: OnDrag.args,
    render: () => (
        <div className={"flex flex-col gap-md"}>
            <div className={"flex items-center gap-md"}>
                <DragCursor label={"Header"} icon={<TextIcon />} isOverSlot={false} />
                <DragCursor label={"Header"} icon={<TextIcon />} isOverSlot={true} />
            </div>
            <div className={"flex items-center gap-md"}>
                <DragCursor label={"Image"} icon={<ImageIcon />} isOverSlot={false} />
                <DragCursor label={"Image"} icon={<ImageIcon />} isOverSlot={true} />
            </div>
            <div className={"flex items-center gap-md"}>
                <DragCursor label={"Button"} icon={<ButtonIcon />} isOverSlot={false} />
                <DragCursor label={"Button"} icon={<ButtonIcon />} isOverSlot={true} />
            </div>
            <div className={"flex items-center gap-md"}>
                <DragCursor label={"No icon"} isOverSlot={false} />
                <DragCursor label={"No icon"} isOverSlot={true} />
            </div>
        </div>
    )
};
