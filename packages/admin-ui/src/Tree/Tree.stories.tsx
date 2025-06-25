import type { Meta, StoryObj } from "@storybook/react";
import { Tree } from "./Tree";

const meta: Meta<typeof Tree> = {
    title: "Components/Tree",
    component: Tree,
    argTypes: {},
    parameters: {
        layout: "padded"
    }
};

export default meta;
type Story = StoryObj<typeof Tree>;

export const Default: Story = {
    args: {
        nodes: [
            {
                id: "1",
                parentId: "0",
                text: "Node 1"
            },
            {
                id: "2",
                parentId: "0",
                text: "Node 2"
            },
            {
                id: "3",
                parentId: "0",
                text: "Node 3"
            },
            {
                id: "1-1",
                parentId: "1",
                text: "Child Node 1-1"
            },
            {
                id: "1-1-1",
                parentId: "1-1",
                text: "Grandchild Node 1-1-1"
            },
            {
                id: "2-1",
                parentId: "2",
                text: "Child Node 2-1"
            }
        ]
    }
};

export const WithRootId: Story = {
    args: {
        ...Default.args,
        rootId: "1"
    }
};

export const WithDefaultOpenNodesIds: Story = {
    args: {
        ...Default.args,
        defaultOpenNodesIds: ["1"]
    }
};

export const WithActiveNodeIds: Story = {
    args: {
        ...Default.args,
        activeNodeIds: ["1"]
    }
};

export const WithOnDropCallback: Story = {
    args: {
        ...Default.args,
        onDrop: async (newTree, options) => {
            console.log("New tree structure:", newTree);
            console.log("Drop options:", options);
        }
    }
};

export const WithonChangeOpenCallback: Story = {
    args: {
        ...Default.args,
        onChangeOpen: newOpenNodes => {
            console.log("New open nodes:", newOpenNodes);
        }
    }
};

export const WithCanDrag: Story = {
    args: {
        ...Default.args,
        nodes: [
            {
                id: "1",
                parentId: "0",
                text: "Node 1 - You cannot drag this node"
            },
            {
                id: "2",
                parentId: "0",
                text: "Node 2"
            },
            {
                id: "3",
                parentId: "0",
                text: "Node 3"
            },
            {
                id: "2-1",
                parentId: "1",
                text: "Child Node 2-1"
            },
            {
                id: "2-1-1",
                parentId: "2",
                text: "Grandchild Node 2-1-1"
            }
        ],
        canDrag: node => node?.id !== "1"
    }
};

export const WithCanDrop: Story = {
    args: {
        ...Default.args,
        nodes: [
            {
                id: "1",
                parentId: "0",
                text: "Node 1 - You cannot drop on this node"
            },
            {
                id: "2",
                parentId: "0",
                text: "Node 2"
            },
            {
                id: "3",
                parentId: "0",
                text: "Node 3"
            },
            {
                id: "2-1",
                parentId: "1",
                text: "Child Node 2-1"
            },
            {
                id: "2-1-1",
                parentId: "2",
                text: "Grandchild Node 2-1-1"
            }
        ],
        canDrop: (_, options) => {
            const { dropTargetId } = options;

            if (dropTargetId === "1") {
                return false; // Prevent dropping on Node 1
            }

            return true;
        }
    }
};
