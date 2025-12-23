import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { ScrollArea, ScrollBar } from "./ScrollArea.js";
import React from "react";
import { Heading } from "~/Heading/index.js";
import { Text } from "~/Text/index.js";
import { Separator } from "~/Separator/index.js";

const meta: Meta<typeof ScrollArea> = {
    title: "Components/ScrollArea",
    component: ScrollArea,
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

type Story = StoryObj<typeof ScrollArea>;

const tags = Array.from({ length: 50 }).map((_, i, a) => `v1.2.0-beta.${a.length - i}`);

export const Default: Story = {
    render: () => {
        return (
            <ScrollArea className="h-72 w-48 rounded-md border border-neutral-dimmed">
                <div className="p-4">
                    <Heading level={6} className="mb-4">
                        Tags
                    </Heading>
                    {tags.map(tag => (
                        <div key={tag}>
                            <Text className="text-sm">{tag}</Text>
                            <Separator className="my-2" />
                        </div>
                    ))}
                </div>
            </ScrollArea>
        );
    }
};

export const HorizontalScrolling: Story = {
    render: () => {
        const works = [
            {
                artist: "Ornella Binni",
                art: "https://images.unsplash.com/photo-1465869185982-5a1a7522cbcb?auto=format&fit=crop&w=300&q=80"
            },
            {
                artist: "Tom Byrom",
                art: "https://images.unsplash.com/photo-1548516173-3db52219d651?auto=format&fit=crop&w=300&q=80"
            },
            {
                artist: "Vladimir Malyavko",
                art: "https://images.unsplash.com/photo-1665984867752-6370ab5ae693?auto=format&fit=crop&w=300&q=80"
            }
        ];

        return (
            <ScrollArea className="w-96 whitespace-nowrap rounded-md border border-neutral-dimmed">
                <div className="flex w-max space-x-4 p-4">
                    {works.map(artwork => (
                        <figure key={artwork.artist} className="shrink-0">
                            <div className="overflow-hidden rounded-md">
                                <img
                                    src={artwork.art}
                                    alt={`Photo by ${artwork.artist}`}
                                    className="aspect-[3/4] h-fit w-fit object-cover"
                                    width={300}
                                    height={400}
                                />
                            </div>
                            <figcaption className="pt-2 text-xs text-neutral-strong">
                                Photo by{" "}
                                <span className="font-semibold text-neutral-primary">
                                    {artwork.artist}
                                </span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        );
    }
};
