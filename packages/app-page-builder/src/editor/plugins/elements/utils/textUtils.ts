import { CoreOptions } from "medium-editor";
import { plugins } from "@webiny/plugins";
import { MediumEditorOptions, PbThemePlugin } from "~/types";

export const getMediumEditorOptions = (
    defaultOptions: CoreOptions,
    mediumEditorOptions: MediumEditorOptions
) => {
    if (typeof mediumEditorOptions === "function") {
        return mediumEditorOptions(defaultOptions);
    }
    return defaultOptions;
};

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
    type: string;
    tag?: string;
    alignment?: string;
};
export const createInitialTextValue = ({
    type,
    alignment = "left",
    tag = "div"
}: CreateInitialTextValueArgs) => {
    const typography = getTypographyFromTheme(type);

    return {
        type,
        typography,
        alignment,
        tag
    };
};
