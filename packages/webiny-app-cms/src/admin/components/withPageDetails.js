// @flow
import * as React from "react";
import { PageDetailsConsumer } from "./PageDetailsContext";

export type WithPageDetailsProps = {
    pageDetails: {
        page: Object
    }
};

export const withPageDetails = (): Function => {
    return (Component: typeof React.Component) => {
        return props => {
            return (
                <PageDetailsConsumer>
                    <Component {...props} />
                </PageDetailsConsumer>
            );
        };
    };
};
