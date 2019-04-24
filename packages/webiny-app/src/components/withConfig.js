// @flow
import * as React from "react";
import { ConfigConsumer } from "./../context/config";

export const withConfig = (): Function => {
    return (Component: typeof React.Component) => {
        return props => {
            return (
                <ConfigConsumer>
                    <Component {...props} />
                </ConfigConsumer>
            );
        };
    };
};
