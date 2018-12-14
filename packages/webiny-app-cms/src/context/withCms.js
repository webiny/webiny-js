// @flow
import * as React from "react";
import { CmsContextConsumer } from "./CmsContext";

export default function withCms() {
    return function decorator(Component: *) {
        return function withCmsComponent(props: *) {
            return (
                <CmsContextConsumer>
                    <Component {...props} />
                </CmsContextConsumer>
            );
        };
    };
}
