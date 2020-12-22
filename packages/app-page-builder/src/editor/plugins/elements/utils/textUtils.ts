import { plugins } from "@webiny/plugins";
import { PbThemePlugin } from "../../../../types";

const getTypographyFromTheme = (type: string) => {
    const [{ theme }] = plugins.byType<PbThemePlugin>("pb-theme");
    return theme.typography[type];
};

export const createInitialEditorValue = (text: string, type: string) => {
    const { className } = getTypographyFromTheme(type);

    return {
        type,
        typography: className,
        data: {
            text
        }
    };
};
