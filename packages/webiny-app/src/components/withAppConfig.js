// @flow
import * as React from "react";
import { AppConfigContextConsumer } from "webiny-app/config";

export function withAppConfig() {
    return function decorator(Component: React.ComponentType<*>) {
        return function withAppConfig(props: Object) {
            return (
                <AppConfigContextConsumer>
                    <Component {...props} />
                </AppConfigContextConsumer>
            );
        };
    };
}
