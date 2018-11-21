// @flow
import * as React from "react";
import { ThemeContextConsumer } from "./../../theme/ThemeContext";

export function withTheme() {
    return function decorator(Component: React.ComponentType<any>) {
        return function renderComponent(props: *) {
            return (
                <ThemeContextConsumer>
                    <Component {...props} />
                </ThemeContextConsumer>
            );
        };
    };
}
