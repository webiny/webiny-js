// @flow
import * as React from "react";
import { SecurityConsumer } from "./Security";

export type WithSecurityPropsType = {
    security: {
        user: Object,
        logout: Function
    }
};

export const withSecurity = (): Function => {
    return (Component: typeof React.Component) => {
        return function WithSecurity(props) {
            return (
                <SecurityConsumer>
                    <Component {...props} />
                </SecurityConsumer>
            );
        };
    };
};
