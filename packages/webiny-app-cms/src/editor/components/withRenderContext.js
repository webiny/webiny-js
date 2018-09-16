import React from "react";
import { RenderContextConsumer } from "webiny-app-cms/editor/context";

export function withRenderContext() {
    return function decorator(Component) {
        return props => {
            return (
                <RenderContextConsumer>
                    <Component {...props} />
                </RenderContextConsumer>
            );
        };
    };
}
