import { ElementStylesModifier } from "~/types";

const position: ElementStylesModifier = ({ element, theme }) => {
    const { position } = element.data.settings || {};
    if (!position) {
        return null;
    }

    return Object.keys(theme.breakpoints || {}).reduce((returnStyles, breakpointName) => {
        if (!position[breakpointName]) {
            return returnStyles;
        }

        const positions = position[breakpointName];
        if (positions === "centered") {
            return {
                ...returnStyles,
                [breakpointName]: {
                    transform: "translate(-50%,-50%)",
                    top: "50%",
                    right: "",
                    bottom: "",
                    left: "50%"
                }
            };
        } else {
            const newStyles: Record<string, string> = {
                transform: "",
                top: "",
                right: "",
                bottom: "",
                left: ""
            };

            for (const side in positions) {
                if (positions[side] === null) {
                    newStyles[side] = "";
                } else if (positions[side] === "") {
                    newStyles[side] = "0px";
                } else if (typeof positions[side] !== "undefined") {
                    newStyles[side] = `${Number(positions[side])}px`;
                }
            }

            return {
                ...returnStyles,
                [breakpointName]: newStyles
            };
        }
    }, {});
};

export const createPosition = () => position;
