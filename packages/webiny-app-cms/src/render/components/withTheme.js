// @flow
import * as React from "react";
import { CmsContextConsumer } from "./../../context/CmsContext";

export function withTheme() {
    return function decorator(Component: React.ComponentType<any>) {
        return function renderComponent(props: *) {
            return (
                <CmsContextConsumer>
                    <Component {...props} />
                </CmsContextConsumer>
            );
        };
    };
}
