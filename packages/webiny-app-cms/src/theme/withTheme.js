import React from "react";
import { ThemeContextConsumer } from "./ThemeContext";

export type WithThemeProps = {
    theme: Object
};

export function withTheme() {
    return function decorator(Component) {
        return props => {
            return (
                <ThemeContextConsumer>
                    <Component {...props} />
                </ThemeContextConsumer>
            );
        };
    };
}

