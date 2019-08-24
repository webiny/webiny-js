// @flow
import * as React from "react";
import { PageBuilderContextConsumer } from "./PageBuilderContext";

export default function withPageBuilder() {
    return function decorator(Component: *) {
        return function withPageBuilderComponent(props: *) {
            return (
                <PageBuilderContextConsumer>
                    <Component {...props} />
                </PageBuilderContextConsumer>
            );
        };
    };
}
