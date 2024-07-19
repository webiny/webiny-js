import { avatarAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(
    avatarAnatomy.keys
);

const baseStyle = definePartsStyle({
    // define the part you're going to style
    container: {
        backgroundColor: "gray.100",
        fontWeight: "bold"
    },
    label: {
        color: "brand.500"
    }
});

export const avatarTheme = defineMultiStyleConfig({ baseStyle });
