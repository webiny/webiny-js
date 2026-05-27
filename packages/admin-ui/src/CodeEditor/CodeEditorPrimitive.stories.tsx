import type { Meta, StoryObj } from "@storybook/react";
import { CodeEditorPrimitive } from "./CodeEditorPrimitive.js";

const meta: Meta<typeof CodeEditorPrimitive> = {
    title: "Components/Form Primitives/CodeEditor",
    component: CodeEditorPrimitive,
    argTypes: {
        onChange: { action: "onChange" }
    },
    parameters: {
        layout: "padded"
    }
};

export default meta;
type Story = StoryObj<typeof CodeEditorPrimitive>;

export const Default: Story = {};
