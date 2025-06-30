import React from "react";
import { ReactComponent as FolderIcon } from "@webiny/icons/folder.svg";
import { ReactComponent as ArticleIcon } from "@webiny/icons/article.svg";
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
                label: "Node 1"
            },
            {
                id: "2",
                parentId: "0",
                label: "Node 2"
            },
            {
                id: "3",
                parentId: "0",
                label: "Node 3"
            },
            {
                id: "1-1",
                parentId: "1",
                label: "Child Node 1-1"
            },
            {
                id: "1-1-1",
                parentId: "1-1",
                label: "Grandchild Node 1-1-1"
            },
            {
                id: "2-1",
                parentId: "2",
                label: "Child Node 2-1"
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
        defaultOpenNodeIds: ["1"]
    }
};

export const WithActiveNodes: Story = {
    args: {
        nodes: [
            {
                id: "1",
                parentId: "0",
                label: "Node 1",
                active: true
            },
            {
                id: "2",
                parentId: "0",
                label: "Node 2"
            },
            {
                id: "3",
                parentId: "0",
                label: "Node 3"
            },
            {
                id: "1-1",
                parentId: "1",
                label: "Child Node 1-1"
            },
            {
                id: "1-1-1",
                parentId: "1-1",
                label: "Grandchild Node 1-1-1"
            },
            {
                id: "2-1",
                parentId: "2",
                label: "Child Node 2-1"
            }
        ]
    }
};

export const WithLoadingNodes: Story = {
    args: {
        nodes: [
            {
                id: "1",
                parentId: "0",
                label: "Node 1",
                loading: true
            },
            {
                id: "2",
                parentId: "0",
                label: "Node 2"
            },
            {
                id: "3",
                parentId: "0",
                label: "Node 3"
            },
            {
                id: "1-1",
                parentId: "1",
                label: "Child Node 1-1"
            },
            {
                id: "1-1-1",
                parentId: "1-1",
                label: "Grandchild Node 1-1-1"
            },
            {
                id: "2-1",
                parentId: "2",
                label: "Child Node 2-1"
            }
        ]
    }
};

// Example custom data type
interface CustomData {
    foo: string;
    bar: number;
}

type StoryWithCustomData = StoryObj<typeof Tree<CustomData>>;

export const WithCustomData: StoryWithCustomData = {
    args: {
        nodes: [
            {
                id: "1",
                parentId: "0",
                label: "Node 1",
                data: { foo: "bar", bar: 42 }
            },
            {
                id: "2",
                parentId: "0",
                label: "Node 2",
                data: { foo: "baz", bar: 99 }
            }
        ],
        onDrop: async (newTree, options) => {
            // newTree and options are fully typed with CustomData
            console.log("Custom data tree:", newTree);
            console.log("Custom data drop options:", options);
        }
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

export const WithOnChangeOpenCallback: Story = {
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
                label: "Node 1 - You cannot drag this node"
            },
            {
                id: "2",
                parentId: "0",
                label: "Node 2"
            },
            {
                id: "3",
                parentId: "0",
                label: "Node 3"
            },
            {
                id: "2-1",
                parentId: "1",
                label: "Child Node 2-1"
            },
            {
                id: "2-1-1",
                parentId: "2",
                label: "Grandchild Node 2-1-1"
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
                label: "Node 1 - You cannot drop on this node"
            },
            {
                id: "2",
                parentId: "0",
                label: "Node 2"
            },
            {
                id: "3",
                parentId: "0",
                label: "Node 3"
            },
            {
                id: "2-1",
                parentId: "1",
                label: "Child Node 2-1"
            },
            {
                id: "2-1-1",
                parentId: "2",
                label: "Grandchild Node 2-1-1"
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

// Example custom data type
interface CustomRenderData {
    icon: React.ReactElement;
}

type StoryWithCustomNodeRenderer = StoryObj<typeof Tree<CustomRenderData>>;

export const WithCustomNodeRenderer: StoryWithCustomNodeRenderer = {
    args: {
        ...Default.args,
        nodes: [
            {
                id: "1",
                parentId: "0",
                label: "Node 1",
                data: { icon: <FolderIcon /> }
            },
            {
                id: "2",
                parentId: "0",
                label: "Node 2",
                data: { icon: <FolderIcon /> }
            },
            {
                id: "3",
                parentId: "0",
                label: "Node 3",
                data: { icon: <FolderIcon /> }
            },
            {
                id: "4",
                parentId: "0",
                label: "Node 4",
                data: { icon: <ArticleIcon /> }
            }
        ],
        renderer: node => (
            <Tree.Item.Content>
                <Tree.Item.Icon label={node.label} element={node.icon} />
                {node.label}
            </Tree.Item.Content>
        )
    }
};

// Example custom sorting by `order` property
interface CustomSortCallbackData {
    order: number;
}

type WithCustomSortCallbackRenderer = StoryObj<typeof Tree<CustomSortCallbackData>>;

export const WithCustomSortCallback: WithCustomSortCallbackRenderer = {
    args: {
        ...Default.args,
        nodes: [
            {
                id: "3",
                parentId: "0",
                label: "Node 3",
                data: {
                    order: 3
                }
            },
            {
                id: "1",
                parentId: "0",
                label: "Node 1",
                data: {
                    order: 1
                }
            },
            {
                id: "2",
                parentId: "0",
                label: "Node 2",
                data: {
                    order: 2
                }
            },
            {
                id: "5",
                parentId: "1",
                label: "Node 5",
                data: {
                    order: 5
                }
            },
            {
                id: "4",
                parentId: "1",
                label: "Node 4",
                data: {
                    order: 4
                }
            },
            {
                id: "6",
                parentId: "1",
                label: "Node 6",
                data: {
                    order: 6
                }
            }
        ],
        sort: (a, b) => (a.data?.order ?? 0) - (b.data?.order ?? 0)
    }
};
