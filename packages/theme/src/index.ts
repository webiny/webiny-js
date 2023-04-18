import { DecoratedTheme, Theme } from "~/types";
import { DecoratedTypography } from "../../../typings/emotion";

export const createTheme = (theme: Theme): DecoratedTheme => {
    // Wrap all typography types into a Proxy instance, adding the `stylesById` method.
    const typography = Object.keys(theme.styles.typography).reduce((current, item) => {
        return {
            ...current,
            [item]: new Proxy(theme.styles.typography[item], {
                get: (target, key) => {
                    if (key === "cssById") {
                        return (id: string) => target.find(item => item.id === id)?.css;
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
    } as DecoratedTheme;
};
