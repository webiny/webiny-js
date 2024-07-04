import { accordionAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(
    accordionAnatomy.keys
);

const baseStyle = definePartsStyle({
    button: {
        px: 6,
        py: 4,
        fontSize: "sm",
        _hover: {
            bg: "gray.200"
        },
        _focus: {
            bg: "gray.100",
            fill: "brand.500"
        }
    },
    panel: {
        px: 6,
        py: 4,
        fontSize: "sm"
    },
    icon: {
        p: 1,
        w: 8,
        h: 8,
        borderRadius: "base",
        color: "black"
    }
});

export const accordionTheme = defineMultiStyleConfig({ baseStyle });
