import React from "react";
import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";
import get from "lodash/get";

export default (): PbRenderElementPlugin => ({
    name: "pb-render-element-typeform",
    type: "pb-render-page-element",
    elementType: "typeform",
    render(props) {
        const { source } = props.element.data;
        if (!source || !source.url) {
            return null;
        }

        const style = {
            width: "100%",
            ...(get(props, "element.settings.style") as unknown as React.CSSProperties)
        };
        return (
            <div style={style}>
                <iframe
                    frameBorder="0"
                    src={source.url}
                    style={{ height: "100%", width: "100%" }}
                />
            </div>
        );
    }
});
