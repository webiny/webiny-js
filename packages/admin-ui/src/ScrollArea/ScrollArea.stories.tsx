import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { ScrollArea, ScrollBar, ScrollPosition } from "./ScrollArea.js";
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
                artist: "Ornella Binni",
                art: "https://images.unsplash.com/photo-1465869185982-5a1a7522cbcb?auto=format&fit=crop&w=300&q=80"
            },
            {
                artist: "Ornella Binni",
                art: "https://images.unsplash.com/photo-1465869185982-5a1a7522cbcb?auto=format&fit=crop&w=300&q=80"
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

export const WithScrollPositionTracking: Story = {
    render: () => {
        const [position, setPosition] = React.useState<ScrollPosition | null>(null);
        const [loadMoreTriggered, setLoadMoreTriggered] = React.useState(false);

        const handleScrollPositionChange = React.useCallback(
            (pos: ScrollPosition) => {
                setPosition(pos);

                // Trigger load more when scrolled 90% down.
                if (pos.top >= 0.9 && !loadMoreTriggered) {
                    setLoadMoreTriggered(true);
                    console.log("Load more triggered at position:", pos);
                } else if (pos.top < 0.9) {
                    setLoadMoreTriggered(false);
                }
            },
            [loadMoreTriggered]
        );

        return (
            <div className="space-y-4">
                <ScrollArea
                    className="h-72 w-48 rounded-md border border-neutral-dimmed"
                    onScrollPositionChange={handleScrollPositionChange}
                >
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

                {position && (
                    <div className="rounded-md border border-neutral-dimmed p-4 space-y-2">
                        <Text className="font-semibold">Scroll Position:</Text>
                        <Text className="text-sm">Top: {(position.top * 100).toFixed(1)}%</Text>
                        <Text className="text-sm">ScrollTop: {position.scrollTop}px</Text>
                        <Text className="text-sm">
                            Load More Triggered: {loadMoreTriggered ? "Yes" : "No"}
                        </Text>
                    </div>
                )}
            </div>
        );
    }
};
