import { plugins } from "@webiny/plugins";
import { PbThemePlugin } from "../../../../types";

const getTypographyFromTheme = (type: string) => {
    const [{ theme }] = plugins.byType<PbThemePlugin>("pb-theme");
    const themeElement = theme.elements[type];
    if (!themeElement) {
        console.warn(`No element of type: "${type}: found in theme.`);
        return "";
    }
    const { types } = themeElement;
    const [defaultType] = types;
    return defaultType.className;
};
type CreateInitialTextValueArgs = {
    text: string;
    type: string;
    tag?: string;
    alignment?: string;
};
export const createInitialTextValue = ({
    text,
    type,
    alignment = "left",
    tag = "div"
}: CreateInitialTextValueArgs) => {
    const typography = getTypographyFromTheme(type);

    return {
        type,
        typography,
        alignment,
        tag,
        data: {
            text
        }
    };
};
