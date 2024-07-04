import { extendTheme } from "@chakra-ui/react";

import { colors, fonts } from "./foundations";
import { accordionTheme as Accordion } from "../Accordion";
import { buttonTheme as Button } from "../Button";

export const theme = extendTheme({
    config: {
        cssVarPrefix: "wby"
    },
    fonts,
    colors,
    components: {
        Accordion,
        Button
    }
});
