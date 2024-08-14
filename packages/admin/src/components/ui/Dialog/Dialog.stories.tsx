import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import {
    Dialog,
    DialogClose,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogDescription,
    DialogTitle,
    DialogFooter
} from "./index";
import { Input } from "../Input";
import { Button } from "../Button";

const meta: Meta<typeof Dialog> = {
    title: "Components/Dialog",
    component: Dialog,
    tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Empty: Story = {};

export const Simple: Story = {
    render: args => (
        <Dialog {...args}>
            <DialogTrigger>
                <Button>{"Open"}</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete your account and
                        remove your data from our servers.
                    </DialogDescription>
                </DialogHeader>
                <>
                    <Input type={"text"} placeholder={"First name"} />
                    <Input type={"text"} placeholder={"Last name"} />
                </>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant={"outline"}>Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button type="submit">Confirm</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
};
