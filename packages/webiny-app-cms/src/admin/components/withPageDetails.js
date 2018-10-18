// @flow
import * as React from "react";
import { PageDetailsConsumer } from "./PageDetailsContext";

export type WithPageDetailsProps = {
    pageDetails: {
        pageId: string,
        refreshPages: Function,
        revision: {
            data: Object,
            loading: boolean,
            refetch: Function
        },
        revisions: {
            data: Object,
            loading: boolean,
            refetch: Function
        }
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
