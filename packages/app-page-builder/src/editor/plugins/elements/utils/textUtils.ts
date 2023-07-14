import { CoreOptions } from "medium-editor";
import { plugins } from "@webiny/plugins";
import { MediumEditorOptions } from "~/types";

import { ThemePlugin } from "@webiny/app-theme";

export const getMediumEditorOptions = (
    defaultOptions: CoreOptions,
    mediumEditorOptions?: MediumEditorOptions
): CoreOptions => {
    if (typeof mediumEditorOptions === "function") {
        return mediumEditorOptions(defaultOptions);
    }
    return defaultOptions;
};

const getTypographyFromTheme = (type: string): string | undefined => {
    const [{ theme }] = plugins.byType<ThemePlugin>(ThemePlugin.type);
    const { typography } = theme.styles;

    // We try either `{type}` or `{type}1`. If none found, the theme will be responsible for defining styles.
    if (type in typography) {
        return type;
    }

    const typeWithSuffix = [type, 1].join("");
    if (typeWithSuffix in typography) {
        return typeWithSuffix;
    }

    return undefined;
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
