import React from "react";
import { ThemeContextConsumer } from "./../Theme/ThemeContext";

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

