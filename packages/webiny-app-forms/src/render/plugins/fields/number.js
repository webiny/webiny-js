// @flow
import React from "react";
import { Input } from "webiny-ui/Input";
import type { RenderFieldPluginType } from "webiny-app-forms/types";

export default ({
    type: "forms-field-render",
    name: "forms-field-render-number",
    field: {
        type: "number",
        render({ field }) {
            return <Input type="number" label={field.label} />;
        }
    }
}: RenderFieldPluginType);
