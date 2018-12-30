// @flow
import React from "react";
import type { RenderElementPluginType } from "webiny-app-cms/types";
import { get } from "lodash";

export default ([
    {
        name: "cms-render-element-typeform",
        type: "cms-render-element",
        element: "cms-element-typeform",
        render(props) {
            const { source } = props.element.data;
            if (!source || !source.url) {
                return null;
            }

            const style = { width: "100%", ...get(props, "element.settings.style") };
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
    }
]: Array<RenderElementPluginType>);
