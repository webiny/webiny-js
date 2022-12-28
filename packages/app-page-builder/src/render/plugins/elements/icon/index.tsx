import React from "react";
import kebabCase from "lodash/kebabCase";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import Icon from "./Icon";
import { createIcon } from "@webiny/app-page-builder-elements/renderers/icon";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = args.elementType || "icon";

    return {
        name: `pb-render-page-element-${kebabCase(elementType)}`,
        type: "pb-render-page-element",
        elementType: "icon",
        renderer: createIcon(),
        render(props) {
            return <Icon {...props} />;
        }
    };
};
