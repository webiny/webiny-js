import { menuAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(
    menuAnatomy.keys
);

// define the base component styles
const baseStyle = definePartsStyle({
    // define the part you're going to style
    button: {},
    list: {
        // this will style the MenuList component
        py: 2,
        borderRadius: "lg",
        border: "1px solid",
        borderColor: "gray.300",
        boxShadow: "md"
    },
    item: {
        // this will style the MenuItem and MenuItemOption components
        color: "gray.900",
        fontSize: "sm",
        py: 2,
        px: 4,
        _hover: {
            bg: "gray.200"
        },
        _focus: {
            bg: "gray.200"
        },
        _disable: {
            color: "gray.300"
        }
    },
    groupTitle: {
        // this will style the text defined by the title prop
        // in the MenuGroup and MenuOptionGroup components
        py: 1,
        px: 4,
        m: 0,
        textTransform: "uppercase",
        color: "gray.600",
        fontSize: "xs"
    },
    command: {
        // this will style the text defined by the command
        // prop in the MenuItem and MenuItemOption components
        textTransform: "uppercase",
        color: "gray.600",
        fontSize: "xs",
        fontWeight: "medium"
    },
    divider: {
        // this will style the MenuDivider component
        my: "2",
        borderColor: "gray.300",
        borderBottom: "1px solid"
    }
});
// export the base styles in the component theme
export const menuTheme = defineMultiStyleConfig({ baseStyle });
