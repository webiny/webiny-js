import { extendTheme } from "@chakra-ui/react";

import { colors, fonts } from "./foundations";
import { accordionTheme as Accordion } from "../Accordion";
import { avatarTheme as Avatar } from "../Avatar";
import { buttonTheme as Button } from "../Button";
import { menuTheme as Menu } from "../Menu";
import { popoverTheme as Popover } from "../Popover";

export const theme = extendTheme({
    config: {
        cssVarPrefix: "wby"
    },
    fonts,
    colors,
    components: {
        Accordion,
        Avatar,
        Button,
        Menu,
        Popover
    }
});
