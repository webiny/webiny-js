import React from "react";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/outlined/add.svg";
import { Box, Button, Flex, Heading, Icon, Text } from "@webiny/ui-chakra";

export interface VerticalCardItem {
    image: React.ReactElement;
    title: string;
    description: string;
    action: string;
}

export const VerticalCard = (props: VerticalCardItem) => {
    return (
        <Box p={6} bg={"gray.100"} borderRadius={"lg"}>
            <Flex
                p={10}
                mb={2}
                minWidth="max-content"
                alignItems={"center"}
                justifyContent={"center"}
            >
                {props.image}
            </Flex>
            <Box mb={2}>
                <Heading as={"h2"} size={"xs"}>
                    {props.title}
                </Heading>
            </Box>
            <Box>
                <Text fontSize="xs">{props.description}</Text>
            </Box>
            <Box mt={8}>
                <Button variant={"primary"} size={"lg"} width={"full"}>
                    {props.action}{" "}
                    <Icon fill={"white"} ml={2}>
                        <AddIcon />
                    </Icon>
                </Button>
            </Box>
        </Box>
    );
};

export interface VerticalCardProps {
    items: VerticalCardItem[];
}

export const VerticalCards = (props: VerticalCardProps) => {
    return (
        <Flex mb={6} gap={6}>
            {props.items.map((item, index) => (
                <VerticalCard key={`card-${index}`} {...item} />
            ))}
        </Flex>
    );
};
