import React from "react";
import { Divider as ChakraDivider } from "@chakra-ui/react";
import { Box } from "~/Box";

export const AccordionDivider = () => {
    return (
        <Box height={8} px={4}>
            <ChakraDivider orientation="vertical" borderColor={"gray.300"} />
        </Box>
    );
};
