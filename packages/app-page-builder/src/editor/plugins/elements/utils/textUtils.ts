import { CoreOptions } from "medium-editor";
import { plugins } from "@webiny/plugins";
import { MediumEditorOptions, PbThemePlugin } from "~/types";

export const getMediumEditorOptions = (
    defaultOptions: CoreOptions,
    mediumEditorOptions?: MediumEditorOptions
): CoreOptions => {
    if (typeof mediumEditorOptions === "function") {
        return mediumEditorOptions(defaultOptions);
    }
    return defaultOptions;
};

const getTypographyFromTheme = (type: string): string => {
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
interface CreateInitialTextValueArgs {
    type: string;
    tag?: string;
    alignment?: string;
}
export const createInitialTextValue = ({
    type,
    alignment = "left",
    tag = "div"
}: CreateInitialTextValueArgs) => {
    // Get from theme object
    const typography = getTypographyFromTheme(type);

    return {
        type,
        typography,
        alignment,
        tag
    };
};
