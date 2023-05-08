import { ThemeStyleType } from "~/nodes/types";

/*
 * Creates suffix name for class names that need to be added to lexical nodes.
 * */
export const createThemeStyleClassSuffixName = (
    tag: string,
    themeStyleType: ThemeStyleType
): string => {
    const themeTypeShortName = themeStyleType === "typography" ? "typog" : themeStyleType;
    return `${tag}-${themeTypeShortName}`;
};
