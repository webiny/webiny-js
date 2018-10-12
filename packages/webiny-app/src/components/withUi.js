// @flow
import * as React from "react";
import { UiConsumer } from "./Ui";

export const withUi = (): Function => {
    return (Component: typeof React.Component) => {
        return props => {
            return (
                <UiConsumer>
                    <Component {...props} />
                </UiConsumer>
            );
        };
    };
};
