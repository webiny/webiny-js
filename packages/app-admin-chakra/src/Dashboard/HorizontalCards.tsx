import React from "react";
import { Box, Flex, Heading, Text } from "@webiny/ui-chakra";

export interface HorizontalCardItem {
    image: string;
    title: string;
    description: string;
}

export const HorizontalCard = (props: HorizontalCardItem) => {
    return (
        <Box p={6} bg={"gray.100"} borderRadius={"lg"}>
            <Box mb={3}>
                <Heading as={"h3"} size={"sm"}>
                    {props.title}
                </Heading>
            </Box>
            <Box mb={4}>
                <Text fontSize="xs">{props.description}</Text>
            </Box>
            {/* @ts-ignore need to be fixed */}
            <Box as={"img"} src={props.image} alt={props.title} w={"full"} />
        </Box>
    );
};

export interface HorizontalCardProps {
    items: HorizontalCardItem[];
}

export const HorizontalCards = (props: HorizontalCardProps) => {
    return (
        <Flex mb={6} gap={6}>
            {props.items.map((item, index) => (
                <HorizontalCard key={`card-${index}`} {...item} />
            ))}
        </Flex>
    );
};
