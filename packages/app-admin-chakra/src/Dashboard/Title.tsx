import React from "react";
import { Box, Heading, Text } from "@webiny/ui-chakra";

export const Title = () => {
    return (
        <Box mt={8} mb={8}>
            <Heading as={"h1"} size={"md"}>
                Hi Leonardo Giacone
            </Heading>
            <Text fontSize="xs">To get started - pick one of the actions below:</Text>
        </Box>
    );
};
