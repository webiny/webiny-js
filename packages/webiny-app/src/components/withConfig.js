// @flow
import * as React from "react";
import { ConfigConsumer } from "./Webiny";

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
