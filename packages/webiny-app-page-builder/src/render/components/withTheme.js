// @flow
import * as React from "react";
import { PageBuilderContextConsumer } from "./../../context/PageBuilderContext";

export function withTheme() {
    return function decorator(Component: React.ComponentType<any>) {
        return function renderComponent(props: *) {
            return (
                <PageBuilderContextConsumer>
                    <Component {...props} />
                </PageBuilderContextConsumer>
            );
        };
    };
}
