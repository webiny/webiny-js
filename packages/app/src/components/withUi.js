// @flow
import * as React from "react";
import { UiContext, UiConsumer } from "./../context/ui";

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

export const useUi = () => {
    return React.useContext(UiContext);
};
