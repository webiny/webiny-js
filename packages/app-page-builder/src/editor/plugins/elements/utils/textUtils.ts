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

export const createInitialEditorValue = (text: string, type: string) => {
    const typography = getTypographyFromTheme(type);

    return {
        type,
        typography,
        alignment: "left",
        data: {
            text
        }
    };
};
