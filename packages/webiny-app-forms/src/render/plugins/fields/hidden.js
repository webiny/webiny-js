// @flow
import React from "react";
import type { RenderFieldPluginType } from "webiny-app-forms/types";

export default ({
    type: "forms-field-render",
    name: "forms-field-render-hidden",
    field: {
        type: "hidden",
        render() {
            return <input type="hidden" />;
        }
    }
}: RenderFieldPluginType);
