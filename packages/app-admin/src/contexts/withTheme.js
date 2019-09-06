// @flow
import * as React from "react";
import { ThemeConsumer } from "./Theme";

export type WithThemeProps = {
    enableDarkMode: () => void,
    disableDarkMode: () => void,
    toggleDarkMode: () => void,
    theme: Object
};

export const withTheme = (): Function => {
    return (Component: typeof React.Component) => {
        return function WithTheme(props: WithThemeProps) {
            return (
                <ThemeConsumer>
                    <Component {...props} />
                </ThemeConsumer>
            );
        };
    };
};
