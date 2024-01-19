import { BaseTheme, DecoratedTypography, Theme } from "~/types";

export const createTheme = (theme: BaseTheme): Theme => {
    // Wrap all typography types into a Proxy instance, adding the `stylesById` method.
    const typography = Object.keys(theme.styles.typography).reduce((current, item) => {
        return {
            ...current,
            [item]: new Proxy(theme.styles.typography[item], {
                get: (target, key) => {
                    if (key === "stylesById") {
                        return (id: string) => target.find(item => item.id === id)?.styles;
                    }
                    return key in target ? target[key as keyof typeof target] : undefined;
                }
            })
        };
    }, {}) as DecoratedTypography;

    return {
        breakpoints: theme.breakpoints,
        styles: {
            ...theme.styles,
            typography
        }
    } as Theme;
};

tema.typography.headings.stylesById