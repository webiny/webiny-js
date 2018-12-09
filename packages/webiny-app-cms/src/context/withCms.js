// @flow
import React from "react";
import { CmsContextProvider } from "./CmsContext";

export type WithCmsProps = {
    theme: Object
};

export function withCms() {
    return function decorator(Component: *) {
        return function withCmsComponent(props: *) {
            return (
                <CmsContextProvider>
                    <Component {...props} />
                </CmsContextProvider>
            );
        };
    };
}
