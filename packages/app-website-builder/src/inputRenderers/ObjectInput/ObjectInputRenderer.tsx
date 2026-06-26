import React from "react";
import type { ElementInputRendererProps } from "~/BaseEditor/config/ElementInput.js";
import { ObjectField } from "~/BaseEditor/defaultConfig/Sidebar/ElementSettings/ObjectField.js";
import { ObjectListField } from "~/BaseEditor/defaultConfig/Sidebar/ElementSettings/ObjectListField.js";

/**
 * Renderer for object fields (`Webiny/Object`). Routes to the single or list variant; both recurse
 * back into the generic `InputField` for their child inputs.
 */
export const ObjectInputRenderer = ({ node, element, bindings }: ElementInputRendererProps) => {
    if (!node || !element) {
        return null;
    }

    if (node.list) {
        return <ObjectListField element={element} node={node} bindings={bindings} />;
    }

    return <ObjectField element={element} node={node} bindings={bindings} />;
};
