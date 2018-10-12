// @flow
import * as React from "react";
import { SecurityConsumer } from "../security/Security";

export const withSecurity = (): Function => {
    return (Component: typeof React.Component) => {
        return props => {
            return (
                <SecurityConsumer>
                    <Component {...props} />
                </SecurityConsumer>
            );
        };
    };
};
