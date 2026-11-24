import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ButtonGroup } from "./ButtonGroup.js";
import { Button, IconButton } from "~/Button/index.js";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";

const meta: Meta<typeof ButtonGroup> = {
    title: "Components/ButtonGroup",
    component: ButtonGroup,
    parameters: {
        layout: "padded"
    }
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

export const Default: Story = {
    args: {
        label: "Actions",
        children: (
            <>
                <Button variant={"secondary"} text={"Cancel"} />
                <Button variant={"primary"} text={"Save"} />
            </>
        )
    }
};

export const GhostIconButtons: Story = {
    args: {
        label: "Row actions",
        variant: "ghost",
        kind: "icon",
        children: (
            <>
                <IconButton variant={"ghost"} icon={<AddIcon />} aria-label={"Add"} />
                <IconButton variant={"ghost"} icon={<EditIcon />} aria-label={"Edit"} />
                <IconButton variant={"ghost"} icon={<DeleteIcon />} aria-label={"Delete"} />
            </>
        )
    }
};

export const AlignedEnd: Story = {
    args: {
        ...Default.args,
        align: "end"
    }
};
