import { isHexColour } from "~/editor/domain/isHexColour.js";

/*
 * A colour value is wrong only when it is a hex attempt (starts with `#`) that is not `#RRGGBB`
 * (R273). A preset token string and a loaded value that is neither stay valid and are kept.
 */
export const isValidStepColour = (colour: string): boolean => {
    if (!colour.startsWith("#")) {
        return true;
    }
    return isHexColour(colour);
};
