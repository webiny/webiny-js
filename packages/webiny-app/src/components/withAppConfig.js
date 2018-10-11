// @flow
import React from "react";
import { AppConfigContextConsumer } from "webiny-app/config";

export function withAppConfig() {
    return function decorator(Component) {
        return props => {
            return (
                <AppConfigContextConsumer>
                    <Component {...props} />
                </AppConfigContextConsumer>
            );
        };
    };
}
