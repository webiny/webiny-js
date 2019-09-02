// @flow
import * as React from "react";
import { PageDetailsConsumer } from "../context/PageDetailsContext";

export type WithPageDetailsProps = Object & {
    pageDetails: {
        page: Object
    }
};

export function withPageDetails() {
    return (Component: typeof React.Component) => {
        return function withPageDetailsRender(props: Object) {
            return (
                <PageDetailsConsumer>
                    <Component {...props} />
                </PageDetailsConsumer>
            );
        };
    };
}
