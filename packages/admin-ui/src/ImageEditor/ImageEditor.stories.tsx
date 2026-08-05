import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "~/Button/index.js";
import { ImageEditor, type ImageEditorValue } from "./index.js";

const meta: Meta<typeof ImageEditor> = {
    title: "Components/ImageEditor",
    component: ImageEditor,
    parameters: {
        layout: "fullscreen"
    }
};

export default meta;

type Story = StoryObj<typeof ImageEditor>;

const DemoImage = {
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600",
    width: 1600,
    height: 1067
};

const Demo = () => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState<ImageEditorValue | undefined>(undefined);

    return (
        <div className={"p-lg"}>
            <Button variant={"primary"} text={"Edit image"} onClick={() => setOpen(true)} />
            <pre className={"mt-md text-sm"}>{JSON.stringify(value, null, 2)}</pre>
            <ImageEditor
                open={open}
                onClose={() => setOpen(false)}
                image={DemoImage}
                value={value}
                onSave={setValue}
            />
        </div>
    );
};

export const Default: Story = {
    render: () => <Demo />
};
