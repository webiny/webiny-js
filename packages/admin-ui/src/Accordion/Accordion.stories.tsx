import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Accordion, type AccordionItemProps as BaseAccordionItemProps } from "./Accordion.js";

import { ReactComponent as WarningIcon } from "@webiny/icons/insert_chart.svg";
import { ReactComponent as ArrowUp } from "@webiny/icons/arrow_upward.svg";
import { ReactComponent as ArrowDown } from "@webiny/icons/arrow_downward.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as TrashIcon } from "@webiny/icons/delete.svg";
import { Button } from "~/Button/index.js";

const meta: Meta<typeof Accordion> = {
    title: "Components/Accordion",
    component: Accordion,
    render: args => {
        return <Accordion {...args} />;
    }
};

export default meta;

type Story = StoryObj<typeof Accordion>;

// Reusable decorators
const LightGreyBackground = (Story: React.ComponentType) => (
    <div className="w-[750px] p-[50px] min-h-[500px] bg-[#f6f7f8]">
        <Story />
    </div>
);

const WhiteBackground = (Story: React.ComponentType) => (
    <div className="w-[750px] p-[50px] min-h-[500px] bg-white">
        <Story />
    </div>
);

const NoBackground = (Story: React.ComponentType) => (
    <div className="w-[750px] p-[50px] min-h-[500px]">
        <Story />
    </div>
);

interface AccordionItemProps extends Omit<BaseAccordionItemProps, "value" | "title" | "children"> {
    index: number;
}

const AccordionItem = (props: AccordionItemProps) => {
    return (
        <Accordion.Item title={`Accordion item ${props.index}`} {...props}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed elit sem, pretium sit amet
            convallis nec, consequat non nulla. Nunc sit amet sagittis tellus. Etiam venenatis, odio
            sed consectetur consectetur, quam quam blandit ante, semper maximus lorem est vel dolor.
            Praesent ac neque rutrum, elementum turpis et, vulputate enim. In ex lorem,
        </Accordion.Item>
    );
};

export const Default: Story = {
    args: {
        children: (
            <>
                <AccordionItem index={1} />
                <AccordionItem index={2} />
                <AccordionItem index={3} />
            </>
        )
    },
    decorators: [LightGreyBackground]
};

export const UnderlineVariant: Story = {
    ...Default,
    args: {
        variant: "underline",
        children: (
            <>
                <AccordionItem
                    index={1}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                />
                <AccordionItem
                    index={2}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                />
            </>
        )
    }
};

export const ContainerVariant: Story = {
    ...Default,
    args: {
        variant: "container",
        children: (
            <>
                <AccordionItem
                    index={1}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                />
                <AccordionItem
                    index={2}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                />
            </>
        )
    }
};

export const ContainerVariantWithAccentBorder: Story = {
    ...Default,
    args: {
        variant: "container",
        border: "accent",
        children: (
            <>
                <AccordionItem
                    index={1}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                />
                <AccordionItem
                    index={2}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                />
            </>
        )
    }
};

export const ContainerVariantWithBaseBackground: Story = {
    decorators: [WhiteBackground],
    args: {
        variant: "container",
        background: "base",
        children: (
            <>
                <AccordionItem
                    index={1}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                />
                <AccordionItem
                    index={2}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                />
            </>
        )
    }
};

export const LightBackground: Story = {
    ...Default,
    args: {
        background: "light",
        children: (
            <>
                <AccordionItem
                    index={1}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                />
                <AccordionItem
                    index={2}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                />
            </>
        )
    }
};

export const BaseBackground: Story = {
    ...Default,
    decorators: [NoBackground],
    args: {
        background: "base",
        children: (
            <>
                <AccordionItem
                    index={1}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                />
                <AccordionItem
                    index={2}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                />
            </>
        )
    }
};
export const WithDescriptions: Story = {
    ...Default,
    args: {
        children: (
            <>
                <AccordionItem
                    index={1}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                />
                <AccordionItem
                    index={2}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                />
                <AccordionItem
                    index={3}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                />
            </>
        )
    },
    argTypes: {}
};
export const WithSubtitles: Story = {
    ...Default,
    args: {
        children: (
            <>
                <AccordionItem index={1} subtitle="(Lorem ipsum dolor sit amet...)" />
                <AccordionItem index={2} subtitle="(Lorem ipsum dolor sit amet...)" />
                <AccordionItem index={3} subtitle="(Lorem ipsum dolor sit amet...)" />
            </>
        )
    },
    argTypes: {}
};

export const WithIcon: Story = {
    ...Default,
    args: {
        children: (
            <>
                <AccordionItem
                    index={1}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                />
                <AccordionItem
                    index={2}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                />
            </>
        )
    }
};

export const WithActionsIcon: Story = {
    ...Default,
    args: {
        children: (
            <>
                <AccordionItem
                    index={1}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                    actions={
                        <>
                            <Accordion.Item.Action icon={<ArrowUp />} />
                            <Accordion.Item.Action icon={<ArrowDown />} />
                            <Accordion.Item.Action.Separator />
                            <Accordion.Item.Action icon={<EditIcon />} />
                            <Accordion.Item.Action icon={<TrashIcon />} />
                        </>
                    }
                />
                <AccordionItem
                    index={2}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                    actions={
                        <>
                            <Accordion.Item.Action icon={<ArrowUp />} />
                            <Accordion.Item.Action icon={<ArrowDown />} />
                            <Accordion.Item.Action.Separator />
                            <Accordion.Item.Action icon={<EditIcon />} />
                            <Accordion.Item.Action icon={<TrashIcon />} />
                        </>
                    }
                />
            </>
        )
    }
};

export const WithDraggableItem: Story = {
    ...Default,
    args: {
        children: (
            <>
                <AccordionItem
                    index={1}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                    draggable={true}
                />
                <AccordionItem
                    index={2}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    draggable={true}
                />
                <AccordionItem
                    index={3}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                />
            </>
        )
    }
};

export const WithNotInteractiveItem: Story = {
    ...Default,
    args: {
        children: (
            <>
                <AccordionItem index={1} description="Not interactive item." interactive={false} />
                <AccordionItem index={2} />
                <AccordionItem index={3} />
            </>
        )
    }
};

export const WithDefaultOpenedItem: Story = {
    ...Default,
    args: {
        children: (
            <>
                <AccordionItem
                    index={1}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                />
                <AccordionItem
                    index={2}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    defaultOpen={true}
                />
            </>
        )
    }
};

export const WithDisabledItem: Story = {
    ...Default,
    args: {
        children: (
            <>
                <AccordionItem
                    index={1}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                />
                <AccordionItem
                    index={2}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    disabled={true}
                />
                <AccordionItem
                    index={3}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    defaultOpen={true}
                    disabled={true}
                />
            </>
        )
    }
};

export const WithControlledOpenedItem: Story = {
    ...Default,
    render: args => {
        const [openFirstItem, setOpenFirstItem] = useState<boolean>();
        const [openSecondItem, setOpenSecondItem] = useState<boolean>();
        const [openThirdItem, setOpenThirdItem] = useState<boolean>();

        return (
            <>
                <Accordion {...args}>
                    <AccordionItem
                        index={1}
                        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                        open={openFirstItem}
                        onOpenChange={open => setOpenFirstItem(open)}
                    />
                    <AccordionItem
                        index={2}
                        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                        open={openSecondItem}
                        onOpenChange={open => setOpenSecondItem(open)}
                    />
                    <AccordionItem
                        index={3}
                        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                        open={openThirdItem}
                        onOpenChange={open => setOpenThirdItem(open)}
                    />
                </Accordion>
                <div className={"flex justify-center mt-lg gap-md"}>
                    <Button
                        onClick={() => setOpenFirstItem(!openFirstItem)}
                        text={"Toggle First Item"}
                    />
                    <Button
                        onClick={() => setOpenSecondItem(!openSecondItem)}
                        text={"Toggle Second Item"}
                    />
                    <Button
                        onClick={() => setOpenThirdItem(!openThirdItem)}
                        text={"Toggle Third Item"}
                    />
                </div>
            </>
        );
    }
};

export const NestedAccordions: Story = {
    decorators: [WhiteBackground],
    name: "Nested Accordions (Base Background)",
    args: {
        background: "base",
        children: (
            <>
                <Accordion.Item
                    title="Level 1"
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                    actions={
                        <>
                            <Accordion.Item.Action icon={<ArrowUp />} />
                            <Accordion.Item.Action icon={<ArrowDown />} />
                            <Accordion.Item.Action.Separator />
                            <Accordion.Item.Action icon={<EditIcon />} />
                            <Accordion.Item.Action icon={<TrashIcon />} />
                        </>
                    }
                >
                    <Accordion>
                        <Accordion.Item
                            title="Level 2"
                            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                            icon={
                                <Accordion.Item.Icon
                                    icon={<WarningIcon />}
                                    label={"Warning icon"}
                                />
                            }
                            actions={
                                <>
                                    <Accordion.Item.Action icon={<ArrowUp />} />
                                    <Accordion.Item.Action icon={<ArrowDown />} />
                                    <Accordion.Item.Action.Separator />
                                    <Accordion.Item.Action icon={<EditIcon />} />
                                    <Accordion.Item.Action icon={<TrashIcon />} />
                                </>
                            }
                        >
                            <Accordion>
                                <Accordion.Item
                                    title="Level 3"
                                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                                    icon={
                                        <Accordion.Item.Icon
                                            icon={<WarningIcon />}
                                            label={"Warning icon"}
                                        />
                                    }
                                    actions={
                                        <>
                                            <Accordion.Item.Action icon={<ArrowUp />} />
                                            <Accordion.Item.Action icon={<ArrowDown />} />
                                            <Accordion.Item.Action.Separator />
                                            <Accordion.Item.Action icon={<EditIcon />} />
                                            <Accordion.Item.Action icon={<TrashIcon />} />
                                        </>
                                    }
                                >
                                    <Accordion>
                                        <Accordion.Item title="Level 4">
                                            <Accordion>
                                                <Accordion.Item title="Level 5">
                                                    Content
                                                </Accordion.Item>
                                            </Accordion>
                                            <Accordion>
                                                <Accordion.Item title="Level 5">
                                                    Content
                                                </Accordion.Item>
                                            </Accordion>
                                            <Accordion>
                                                <Accordion.Item title="Level 5">
                                                    Content
                                                </Accordion.Item>
                                            </Accordion>
                                        </Accordion.Item>
                                    </Accordion>
                                </Accordion.Item>
                            </Accordion>
                            <Accordion>
                                <Accordion.Item title="Level 3">Content</Accordion.Item>
                            </Accordion>
                            <Accordion>
                                <Accordion.Item title="Level 3">Content</Accordion.Item>
                            </Accordion>
                        </Accordion.Item>
                    </Accordion>
                </Accordion.Item>
                <Accordion.Item title="Level 1">
                    <Accordion>
                        <Accordion.Item
                            title="Level 2"
                            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                            icon={
                                <Accordion.Item.Icon
                                    icon={<WarningIcon />}
                                    label={"Warning icon"}
                                />
                            }
                            actions={
                                <>
                                    <Accordion.Item.Action icon={<ArrowUp />} />
                                    <Accordion.Item.Action icon={<ArrowDown />} />
                                    <Accordion.Item.Action.Separator />
                                    <Accordion.Item.Action icon={<EditIcon />} />
                                    <Accordion.Item.Action icon={<TrashIcon />} />
                                </>
                            }
                        >
                            <Accordion>
                                <Accordion.Item title="Level 3">
                                    <Accordion>
                                        <Accordion.Item title="Level 4">
                                            <Accordion>
                                                <Accordion.Item title="Level 5">
                                                    Test
                                                </Accordion.Item>
                                            </Accordion>
                                            <Accordion>
                                                <Accordion.Item title="Level 5">
                                                    Test
                                                </Accordion.Item>
                                            </Accordion>
                                            <Accordion>
                                                <Accordion.Item title="Level 5">
                                                    Test
                                                </Accordion.Item>
                                            </Accordion>
                                        </Accordion.Item>
                                    </Accordion>
                                </Accordion.Item>
                            </Accordion>
                            <Accordion>
                                <Accordion.Item title="Level 3">Content</Accordion.Item>
                            </Accordion>
                            <Accordion>
                                <Accordion.Item title="Level 3">Content</Accordion.Item>
                            </Accordion>
                        </Accordion.Item>
                    </Accordion>
                </Accordion.Item>
            </>
        )
    }
};

export const NestedAccordionsLight: Story = {
    ...Default,
    name: "Nested Accordions (Light Background)",
    args: {
        background: "light",
        children: (
            <>
                <Accordion.Item
                    title="Level 1"
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                    actions={
                        <>
                            <Accordion.Item.Action icon={<ArrowUp />} />
                            <Accordion.Item.Action icon={<ArrowDown />} />
                            <Accordion.Item.Action.Separator />
                            <Accordion.Item.Action icon={<EditIcon />} />
                            <Accordion.Item.Action icon={<TrashIcon />} />
                        </>
                    }
                >
                    <Accordion>
                        <Accordion.Item
                            title="Level 2"
                            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                            icon={
                                <Accordion.Item.Icon
                                    icon={<WarningIcon />}
                                    label={"Warning icon"}
                                />
                            }
                            actions={
                                <>
                                    <Accordion.Item.Action icon={<ArrowUp />} />
                                    <Accordion.Item.Action icon={<ArrowDown />} />
                                    <Accordion.Item.Action.Separator />
                                    <Accordion.Item.Action icon={<EditIcon />} />
                                    <Accordion.Item.Action icon={<TrashIcon />} />
                                </>
                            }
                        >
                            <Accordion>
                                <Accordion.Item
                                    title="Level 3"
                                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                                    icon={
                                        <Accordion.Item.Icon
                                            icon={<WarningIcon />}
                                            label={"Warning icon"}
                                        />
                                    }
                                    actions={
                                        <>
                                            <Accordion.Item.Action icon={<ArrowUp />} />
                                            <Accordion.Item.Action icon={<ArrowDown />} />
                                            <Accordion.Item.Action.Separator />
                                            <Accordion.Item.Action icon={<EditIcon />} />
                                            <Accordion.Item.Action icon={<TrashIcon />} />
                                        </>
                                    }
                                >
                                    <Accordion>
                                        <Accordion.Item title="Level 4">
                                            <Accordion>
                                                <Accordion.Item title="Level 5">
                                                    Content
                                                </Accordion.Item>
                                            </Accordion>
                                            <Accordion>
                                                <Accordion.Item title="Level 5">
                                                    Content
                                                </Accordion.Item>
                                            </Accordion>
                                            <Accordion>
                                                <Accordion.Item title="Level 5">
                                                    Content
                                                </Accordion.Item>
                                            </Accordion>
                                        </Accordion.Item>
                                    </Accordion>
                                </Accordion.Item>
                            </Accordion>
                            <Accordion>
                                <Accordion.Item title="Level 3">Content</Accordion.Item>
                            </Accordion>
                            <Accordion>
                                <Accordion.Item title="Level 3">Content</Accordion.Item>
                            </Accordion>
                        </Accordion.Item>
                    </Accordion>
                </Accordion.Item>
                <Accordion.Item title="Level 1">
                    <Accordion>
                        <Accordion.Item
                            title="Level 2"
                            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                            icon={
                                <Accordion.Item.Icon
                                    icon={<WarningIcon />}
                                    label={"Warning icon"}
                                />
                            }
                            actions={
                                <>
                                    <Accordion.Item.Action icon={<ArrowUp />} />
                                    <Accordion.Item.Action icon={<ArrowDown />} />
                                    <Accordion.Item.Action.Separator />
                                    <Accordion.Item.Action icon={<EditIcon />} />
                                    <Accordion.Item.Action icon={<TrashIcon />} />
                                </>
                            }
                        >
                            <Accordion>
                                <Accordion.Item title="Level 3">
                                    <Accordion>
                                        <Accordion.Item title="Level 4">
                                            <Accordion>
                                                <Accordion.Item title="Level 5">
                                                    Test
                                                </Accordion.Item>
                                            </Accordion>
                                            <Accordion>
                                                <Accordion.Item title="Level 5">
                                                    Test
                                                </Accordion.Item>
                                            </Accordion>
                                            <Accordion>
                                                <Accordion.Item title="Level 5">
                                                    Test
                                                </Accordion.Item>
                                            </Accordion>
                                        </Accordion.Item>
                                    </Accordion>
                                </Accordion.Item>
                            </Accordion>
                            <Accordion>
                                <Accordion.Item title="Level 3">Content</Accordion.Item>
                            </Accordion>
                            <Accordion>
                                <Accordion.Item title="Level 3">Content</Accordion.Item>
                            </Accordion>
                        </Accordion.Item>
                    </Accordion>
                </Accordion.Item>
            </>
        )
    }
};

export const WithColorMark: Story = {
    ...Default,
    args: {
        children: (
            <>
                <AccordionItem
                    colorMark={"#ff6584"}
                    index={1}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                />
            </>
        )
    }
};

export const Locked: Story = {
    ...Default,
    args: {
        children: (
            <>
                <AccordionItem
                    index={1}
                    locked={true}
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                />
            </>
        )
    }
};

export const IndicatorPositionLeft: Story = {
    decorators: [LightGreyBackground],
    args: {
        variant: "underline",
        openClosedIndicatorPosition: "right",
        children: (
            <>
                <AccordionItem
                    index={1}
                    description="When indicator is on the left, it replaces the icon position."
                />
                <AccordionItem
                    index={2}
                    description="Icons are not shown when indicator is on the left."
                />
                <AccordionItem
                    index={3}
                    description="Actions are still shown on the right side."
                    actions={
                        <Accordion.Item.Action
                            icon={<TrashIcon />}
                            onClick={() => alert("Delete clicked")}
                        />
                    }
                />
            </>
        )
    }
};

export const IndicatorPositionRight: Story = {
    decorators: [LightGreyBackground],
    args: {
        variant: "underline",
        openClosedIndicatorPosition: "right",
        children: (
            <>
                <AccordionItem
                    index={1}
                    description="Default behavior with indicator on the right."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                />
                <AccordionItem
                    index={2}
                    description="Icons can be shown when indicator is on the right."
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                />
            </>
        )
    }
};

// Add a Documentation story
export const Documentation: Story = {
    render: args => {
        return <Accordion {...args} />;
    },
    args: {
        variant: "underline",
        children: (
            <>
                <Accordion.Item
                    title="Accordion Item 1"
                    description="This is a description for the first item"
                    icon={<Accordion.Item.Icon icon={<WarningIcon />} label={"Warning icon"} />}
                    actions={
                        <>
                            <Accordion.Item.Action icon={<EditIcon />} />
                            <Accordion.Item.Action icon={<TrashIcon />} />
                        </>
                    }
                >
                    This is the content for the first accordion item. It can contain any React
                    elements.
                </Accordion.Item>

                <Accordion.Item
                    title="Accordion Item 2"
                    description="This is a description for the second item"
                    defaultOpen={true}
                >
                    This is the content for the second accordion item. It&apos;s open by default.
                </Accordion.Item>

                <Accordion.Item
                    title="Disabled Item"
                    description="This item cannot be interacted with"
                    disabled={true}
                >
                    This content won&apos;t be visible because the item is disabled.
                </Accordion.Item>
            </>
        )
    },
    argTypes: {
        variant: {
            control: "select",
            options: ["underline", "container"],
            description: "The visual style of the accordion"
        },
        background: {
            control: "select",
            options: ["base", "light", "transparent"],
            description: "The background color of the accordion"
        },
        children: {
            description:
                "The content of the accordion. Please refer to the example code for details."
        }
    }
};
